export interface CsvToListConverterOptions {
  /** Séparateur de champs. Par défaut, deviné entre `;`, tabulation et `,` sur les 40 premières lignes. */
  fieldDelimiter?: string;
  /** Délimiteur de texte. Par défaut `"` (un `""` à l'intérieur vaut un guillemet). */
  textDelimiter?: string;
  /** Enlève les espaces autour de chaque champ. Par défaut `true`. */
  trim?: boolean;
}

export interface CsvToListConverter {
  /** Texte CSV → `rows[ligne][colonne]`. */
  convert(text: string): string[][];
}

/**
 * Lecture de CSV, comme `CsvToListConverter` du paquet Flutter `csv` :
 * ```ts
 * const rows = CsvToListConverter().convert(texte);
 * ```
 * Retours à la ligne `\n`, `\r\n` ou `\r` ; le BOM initial est ignoré.
 */
export function CsvToListConverter(options: CsvToListConverterOptions = {}): CsvToListConverter {
  const quote = options.textDelimiter ?? '"';
  const trim = options.trim ?? true;
  return {
    convert(text) {
      const lines = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
      const sep = options.fieldDelimiter ?? guessDelimiter(lines);
      return lines.map((line) => {
        const out: string[] = [];
        let cur = "";
        let quoted = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (quoted) {
            if (ch === quote) {
              if (line[i + 1] === quote) {
                cur += quote;
                i++;
              } else quoted = false;
            } else cur += ch;
          } else if (ch === quote) quoted = true;
          else if (line.startsWith(sep, i)) {
            out.push(cur);
            cur = "";
            i += sep.length - 1;
          } else cur += ch;
        }
        out.push(cur);
        return trim ? out.map((x) => x.trim()) : out;
      });
    },
  };
}

function guessDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 40);
  return [";", "\t", ","]
    .map((s) => [s, sample.reduce((n, l) => n + l.split(s).length - 1, 0)] as const)
    .sort((a, b) => b[1] - a[1])[0]![0];
}
