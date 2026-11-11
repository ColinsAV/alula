// Version mobile du sélecteur de fichiers (Expo). Nécessite `expo-document-picker`.
import * as DocumentPicker from "expo-document-picker";
import {
  extensionOf,
  matchesOptions,
  mimeTypesByExtension,
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

function mimeTypes({ type = "any", allowedExtensions }: PickFilesOptions): string[] {
  if (type !== "custom") return mimeTypesByFileType[type];
  const types = normalizeExtensions(allowedExtensions).map((ext) => mimeTypesByExtension[ext]);
  // Extension inconnue : pas de filtre, l'extension est revérifiée après le choix.
  return types.every(Boolean) ? (types as string[]) : [];
}

/** Sélecteur de fichiers : voir la version web (filePicker.ts) pour la documentation. */
export const FilePicker = {
  platform: {
    async pickFiles(options: PickFilesOptions = {}): Promise<FilePickerResult | null> {
      const types = mimeTypes(options);
      const result = await DocumentPicker.getDocumentAsync({
        type: types.length > 0 ? types : "*/*",
        multiple: options.allowMultiple ?? false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return null;
      const files = result.assets
        .filter((asset) => matchesOptions(asset.name, options))
        .map((asset) => ({
          name: asset.name,
          size: asset.size ?? 0,
          extension: extensionOf(asset.name),
          readAsBytes: async () => new Uint8Array(await (await fetch(asset.uri)).arrayBuffer()),
        }));
      return files.length > 0 ? { files } : null;
    },
  },
};
