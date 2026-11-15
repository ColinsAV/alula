import { strFromU8, unzipSync } from "fflate";

/**
 * Valeur d'une cellule : texte, nombre, ou `null` si la cellule est vide.
 * Les dates et heures Excel sont des nombres (jours depuis le 30/12/1899) : voir `Excel.dateFromSerial`.
 */
export type CellValue = string | number | null;

/** `visible`, `hidden` (masquée) ou `veryHidden` (masquée par macro). */
export type SheetVisibility = "visible" | "hidden" | "veryHidden";

export interface DecodeOptions {
  /** Ignore les colonnes au-delà (1 = colonne A). Accélère la lecture des classeurs très mis en forme. */
  maxColumns?: number;
}

/** Une feuille d'un classeur, comme `Sheet` du paquet Flutter `excel`. Les cellules sont lues à la première demande. */
export interface Sheet {
  readonly sheetName: string;
  readonly visibility: SheetVisibility;
  /** `rows[ligne][colonne]` (base 0). Lignes et cellules absentes valent `[]` et `null`. */
  readonly rows: CellValue[][];
  readonly maxRows: number;
  readonly maxColumns: number;
  /** Liens hypertextes : clé `"ligne:colonne"` (base 0) → adresse. */
  readonly hyperlinks: Record<string, string>;
  /** Une cellule (base 0), ou `null`. */
  cell(row: number, column: number): CellValue;
}

/** Un classeur .xlsx / .xlsm décodé. */
export interface Excel {
  /** Les feuilles, dans l'ordre du classeur. */
  readonly sheets: Sheet[];
  /** Les feuilles par nom, comme `excel.tables` en Flutter. */
  readonly tables: Record<string, Sheet>;
}

/**
 * Lecture des classeurs Excel (.xlsx, .xlsm), comme le paquet Flutter `excel` :
 * ```ts
 * const excel = Excel.decodeBytes(await file.readAsBytes());
 * for (const sheet of excel.sheets) console.log(sheet.sheetName, sheet.maxRows);
 * const rows = excel.tables["PRESTATIONS"]?.rows ?? [];
 * ```
 * Lecture seule. Le format binaire .xls n'est pas pris en charge.
 */
export const Excel = {
  /** Décode un classeur. Lève une `Error` si les octets ne sont pas un classeur .xlsx / .xlsm. */
  decodeBytes(bytes: Uint8Array, options: DecodeOptions = {}): Excel {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("Ce fichier n'est pas un classeur .xlsx ou .xlsm.");
    let parts: Record<string, Uint8Array>;
    try {
      parts = unzipSync(bytes);
    } catch {
      throw new Error("Classeur illisible : l'archive est endommagée.");
    }
    if (!parts["xl/workbook.xml"]) throw new Error("Ce fichier n'est pas un classeur Excel (xl/workbook.xml absent).");

    const texts = new Map<string, string | null>();
    const txt = (name: string) => {
      if (!texts.has(name)) texts.set(name, parts[name] ? strFromU8(parts[name]!) : null);
      return texts.get(name)!;
    };

    // Textes partagés : les cellules de type « s » y renvoient par leur index.
    const shared: string[] = [];
    const sst = txt("xl/sharedStrings.xml");
    if (sst) {
      for (const si of sst.split(/<si>|<si [^>]*>/).slice(1)) {
        shared.push(textOf(si.split("</si>")[0]!.replace(/<rPh[\s\S]*?<\/rPh>/g, "")));
      }
    }

    const rels = relationships(txt("xl/_rels/workbook.xml.rels"), (target) =>
      target.startsWith("/") ? target.slice(1) : "xl/" + target.replace(/^\.\//, ""),
    );

    const sheets: Sheet[] = [];
    for (const m of (txt("xl/workbook.xml") ?? "").matchAll(/<sheet\b[^>]*\/?>/g)) {
      const name = attr(m[0], "name");
      const rid = /\b[A-Za-z0-9]+:id="([^"]*)"/.exec(m[0])?.[1];
      const path = rid ? rels[rid] : undefined;
      if (!name || !path) continue;
      sheets.push(sheet(unesc(name), (attr(m[0], "state") as SheetVisibility | null) ?? "visible", path, txt, shared, options));
    }

    return { sheets, tables: Object.fromEntries(sheets.map((s) => [s.sheetName, s])) };
  },

  /** Numéro de série Excel (jours depuis le 30/12/1899, fraction = heure) → `Date` en UTC. */
  dateFromSerial(serial: number): Date {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(serial * 86400000));
  },
};

function sheet(
  sheetName: string,
  visibility: SheetVisibility,
  path: string,
  txt: (name: string) => string | null,
  shared: string[],
  options: DecodeOptions,
): Sheet {
  let rows: CellValue[][] | null = null;
  let links: Record<string, string> | null = null;

  const readRows = (): CellValue[][] => {
    if (rows) return rows;
    const xml = txt(path) ?? "";
    const g: CellValue[][] = [];
    for (const rm of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const rowNumber = Number(attr(rm[1]!, "r"));
      for (const cm of rm[2]!.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const at = cm[1] ?? "";
        const body = cm[2] ?? "";
        const ref = attr(at, "r");
        if (!ref) continue;
        const col = columnNumber(ref);
        if (options.maxColumns && col > options.maxColumns) continue;
        const t = attr(at, "t");
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        let value: CellValue = null;
        if (t === "s" && v !== undefined) value = shared[Number(v)] ?? null;
        else if (t === "inlineStr") value = textOf(body);
        else if ((t === "str" || t === "e") && v !== undefined) value = unesc(v);
        else if (t === "b" && v !== undefined) value = v === "1" ? "TRUE" : "FALSE";
        else if (v !== undefined) value = isNaN(Number(v)) ? unesc(v) : Number(v);
        if (value === null || value === "") continue;
        const r = Number(/(\d+)$/.exec(ref)?.[1] ?? rowNumber) - 1;
        (g[r] ??= [])[col - 1] = value;
      }
    }
    rows = Array.from(g, (r) => Array.from(r ?? [], (c) => c ?? null));
    return rows;
  };

  const readLinks = (): Record<string, string> => {
    if (links) return links;
    links = {};
    const xml = txt(path) ?? "";
    const R = relationships(txt(path.replace(/([^/]+)$/, "_rels/$1.rels")), unesc);
    for (const m of xml.matchAll(/<hyperlink\b[^>]*>/g)) {
      const ref = attr(m[0], "ref");
      const rid = /\b[A-Za-z0-9]+:id="([^"]*)"/.exec(m[0])?.[1];
      const mm = ref ? /^([A-Z]+)(\d+)/.exec(ref) : null;
      if (mm && rid && R[rid]) links[`${Number(mm[2]) - 1}:${columnNumber(mm[1]!) - 1}`] = R[rid]!;
    }
    return links;
  };

  return {
    sheetName,
    visibility,
    get rows() {
      return readRows();
    },
    get maxRows() {
      return readRows().length;
    },
    get maxColumns() {
      return readRows().reduce((n, r) => Math.max(n, r.length), 0);
    },
    get hyperlinks() {
      return readLinks();
    },
    cell(row, column) {
      return readRows()[row]?.[column] ?? null;
    },
  };
}

function relationships(xml: string | null, target: (t: string) => string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of (xml ?? "").matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(m[0], "Id");
    const t = attr(m[0], "Target");
    if (id && t) out[id] = target(t);
  }
  return out;
}

function attr(tag: string, name: string): string | null {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? null;
}

/** « AB12 » → 28. */
function columnNumber(ref: string): number {
  let n = 0;
  for (const c of /^([A-Z]+)/.exec(ref)?.[1] ?? "") n = n * 26 + (c.charCodeAt(0) - 64);
  return n;
}

function textOf(xml: string): string {
  return unesc([...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));
}

function unesc(t: string): string {
  return t
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}
