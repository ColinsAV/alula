// Version web du sélecteur de fichiers (mobile : filePicker.native.ts).
import {
  extensionOf,
  matchesOptions,
  mimeTypesByFileType,
  normalizeExtensions,
  type FilePickerResult,
  type PickFilesOptions,
} from "./filePickerTypes";

export {
  FileType,
  type FilePickerResult,
  type PickFilesOptions,
  type PlatformFile,
} from "./filePickerTypes";

/** FileReader plutôt que `file.arrayBuffer()` : disponible partout, y compris dans jsdom. */
function readBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function accept({ type = "any", allowedExtensions }: PickFilesOptions): string {
  if (type === "custom") return normalizeExtensions(allowedExtensions).map((ext) => `.${ext}`).join(",");
  return mimeTypesByFileType[type].join(",");
}

/**
 * Sélecteur de fichiers, comme le paquet Flutter `file_picker` :
 * ```ts
 * const result = await FilePicker.platform.pickFiles({ type: FileType.custom, allowedExtensions: ["xlsx"] });
 * if (result) console.log(result.files[0].name);
 * ```
 * Renvoie `null` si l'utilisateur annule ou si aucun fichier ne correspond.
 * À appeler depuis une action de l'utilisateur (ex. `onPressed`) : les navigateurs
 * bloquent l'ouverture du sélecteur sinon.
 */
export const FilePicker = {
  platform: {
    pickFiles(options: PickFilesOptions = {}): Promise<FilePickerResult | null> {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept(options);
        input.multiple = options.allowMultiple ?? false;
        // Ajouté au document (invisible) : certaines versions de Safari n'ouvrent pas
        // le sélecteur d'un champ détaché.
        input.style.display = "none";
        document.body.appendChild(input);

        const done = (result: FilePickerResult | null) => {
          input.remove();
          resolve(result);
        };
        input.onchange = () => {
          const files = Array.from(input.files ?? [])
            .filter((file) => matchesOptions(file.name, options))
            .map((file) => ({
              name: file.name,
              size: file.size,
              extension: extensionOf(file.name),
              readAsBytes: () => readBytes(file),
            }));
          done(files.length > 0 ? { files } : null);
        };
        input.oncancel = () => done(null);
        input.click();
      });
    },
  },
};
