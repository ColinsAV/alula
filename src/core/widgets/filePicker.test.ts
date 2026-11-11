import { afterEach, describe, expect, it, vi } from "vitest";
import { FilePicker, FileType } from "./filePicker";

/** Simule le choix de l'utilisateur quand le sélecteur s'ouvre (`input.click()`). */
function choose(files: File[] | "cancel") {
  return vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function (this: HTMLInputElement) {
    if (files === "cancel") {
      this.dispatchEvent(new Event("cancel"));
      return;
    }
    Object.defineProperty(this, "files", { value: files });
    this.dispatchEvent(new Event("change"));
  });
}

afterEach(() => vi.restoreAllMocks());

describe("FilePicker.platform.pickFiles (web)", () => {
  it("filtre le sélecteur sur les extensions demandées", async () => {
    let accept = "";
    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function (this: HTMLInputElement) {
      accept = this.accept;
      this.dispatchEvent(new Event("cancel"));
    });
    await FilePicker.platform.pickFiles({ type: FileType.custom, allowedExtensions: ["xlsx", ".CSV"] });
    expect(accept).toBe(".xlsx,.csv");
  });

  it("renvoie le fichier choisi, lisible", async () => {
    choose([new File(["abc"], "Rapport.XLSX")]);
    const result = await FilePicker.platform.pickFiles({ type: FileType.custom, allowedExtensions: ["xlsx"] });
    expect(result?.files).toHaveLength(1);
    const file = result!.files[0]!;
    expect(file.name).toBe("Rapport.XLSX");
    expect(file.extension).toBe("xlsx");
    expect(file.size).toBe(3);
    expect(Array.from(await file.readAsBytes())).toEqual([97, 98, 99]);
  });

  it("écarte un fichier d'une autre extension (choix « Tous les fichiers »)", async () => {
    choose([new File(["x"], "photo.png")]);
    const result = await FilePicker.platform.pickFiles({ type: FileType.custom, allowedExtensions: ["xlsx"] });
    expect(result).toBeNull();
  });

  it("renvoie null si l'utilisateur annule, et retire le champ du document", async () => {
    choose("cancel");
    expect(await FilePicker.platform.pickFiles()).toBeNull();
    expect(document.querySelectorAll("input[type=file]")).toHaveLength(0);
  });
});
