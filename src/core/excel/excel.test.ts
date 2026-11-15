// @vitest-environment node
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { CsvToListConverter } from "./csv";
import { Excel } from "./excel";

/** Classeur minimal : deux feuilles (la seconde masquée), textes partagés, nombres, lien hypertexte. */
function classeur(): Uint8Array {
  return zipSync({
    "xl/workbook.xml": strToU8(
      `<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
        `<sheet name="PRESTATIONS" sheetId="1" r:id="rId1"/><sheet name="Cachée &amp; co" sheetId="2" state="hidden" r:id="rId2"/>` +
        `</sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>`,
    ),
    "xl/sharedStrings.xml": strToU8(`<sst><si><t>AGENCE</t></si><si><r><t>RD</t></r><r><t>V</t></r></si><si><t>Petit-Bourg</t></si></sst>`),
    "xl/worksheets/sheet1.xml": strToU8(
      `<worksheet xmlns:r="r"><sheetData>` +
        `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>` +
        `<row r="3"><c r="A3" t="s"><v>2</v></c><c r="B3"><v>12</v></c><c r="D3" t="inlineStr"><is><t>a &lt; b</t></is></c></row>` +
        `<row r="4"><c r="A4"><v>46343.375</v></c><c r="Z4"><v>1</v></c></row>` +
        `</sheetData><hyperlinks><hyperlink ref="A3" r:id="rIdL"/></hyperlinks></worksheet>`,
    ),
    "xl/worksheets/_rels/sheet1.xml.rels": strToU8(`<Relationships><Relationship Id="rIdL" Target="https://exemple.fr/?a=1&amp;b=2"/></Relationships>`),
    "xl/worksheets/sheet2.xml": strToU8(`<worksheet><sheetData><row r="1"><c r="A1" t="str"><v>x</v></c></row></sheetData></worksheet>`),
  });
}

describe("Excel.decodeBytes", () => {
  it("lit les feuilles, leur visibilité et leurs cellules", () => {
    const excel = Excel.decodeBytes(classeur());
    expect(excel.sheets.map((s) => [s.sheetName, s.visibility])).toEqual([
      ["PRESTATIONS", "visible"],
      ["Cachée & co", "hidden"],
    ]);
    const s = excel.tables["PRESTATIONS"]!;
    expect(s.rows[0]).toEqual(["AGENCE", "RDV"]);
    expect(s.rows[1]).toEqual([]);
    expect(s.rows[2]).toEqual(["Petit-Bourg", 12, null, "a < b"]);
    expect(s.cell(3, 0)).toBe(46343.375);
    expect(s.maxRows).toBe(4);
    expect(s.maxColumns).toBe(26);
    expect(s.hyperlinks).toEqual({ "2:0": "https://exemple.fr/?a=1&b=2" });
    expect(excel.tables["Cachée & co"]!.rows).toEqual([["x"]]);
  });

  it("ignore les colonnes au-delà de maxColumns", () => {
    const s = Excel.decodeBytes(classeur(), { maxColumns: 2 }).sheets[0]!;
    expect(s.maxColumns).toBe(2);
    expect(s.rows[2]).toEqual(["Petit-Bourg", 12]);
  });

  it("refuse ce qui n'est pas un classeur", () => {
    expect(() => Excel.decodeBytes(strToU8("nom;prénom"))).toThrow(/n'est pas un classeur/);
    expect(() => Excel.decodeBytes(zipSync({ "a.txt": strToU8("a") }))).toThrow(/workbook\.xml/);
  });

  it("convertit les dates Excel", () => {
    expect(Excel.dateFromSerial(46343.375).toISOString()).toBe("2026-11-17T09:00:00.000Z");
  });
});

describe("CsvToListConverter", () => {
  it("devine le séparateur et gère les guillemets", () => {
    const rows = CsvToListConverter().convert('﻿nom;prénom;note\r\n"DUPONT; Jean" ; Marie ;"dit ""Jo"""\n');
    expect(rows).toEqual([["nom", "prénom", "note"], ["DUPONT; Jean", "Marie", 'dit "Jo"'], [""]]);
  });

  it("accepte un séparateur imposé", () => {
    expect(CsvToListConverter({ fieldDelimiter: "," }).convert("a;b,c")).toEqual([["a;b", "c"]]);
  });
});
