/** Types de fichiers proposés par le sélecteur, comme `FileType` du paquet Flutter `file_picker`. */
export const FileType = {
  any: "any",
  image: "image",
  video: "video",
  audio: "audio",
  /** Images et vidéos. */
  media: "media",
  /** Extensions précisées dans `allowedExtensions`. */
  custom: "custom",
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export interface PickFilesOptions {
  /** Par défaut `FileType.any`. */
  type?: FileType;
  /** Avec `FileType.custom` : extensions acceptées, sans le point (`["xlsx", "csv"]`). */
  allowedExtensions?: string[];
  /** Plusieurs fichiers à la fois. Par défaut `false`. */
  allowMultiple?: boolean;
}

/** Un fichier choisi, identique sur web et mobile (le `PlatformFile` de Flutter). */
export interface PlatformFile {
  name: string;
  /** Taille en octets. */
  size: number;
  /** Extension en minuscules, sans le point (`"xlsx"`), ou `null`. */
  extension: string | null;
  /** Contenu du fichier. */
  readAsBytes(): Promise<Uint8Array>;
}

export interface FilePickerResult {
  files: PlatformFile[];
}

/** Types MIME par catégorie (filtre du sélecteur). */
export const mimeTypesByFileType: Record<Exclude<FileType, "custom">, string[]> = {
  any: [],
  image: ["image/*"],
  video: ["video/*"],
  audio: ["audio/*"],
  media: ["image/*", "video/*"],
};

/** Types MIME des extensions courantes : le sélecteur mobile filtre par type MIME, pas par extension. */
export const mimeTypesByExtension: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  json: "application/json",
  txt: "text/plain",
  zip: "application/zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

export function normalizeExtensions(extensions: string[] | undefined): string[] {
  return (extensions ?? []).map((ext) => ext.replace(/^\./, "").toLowerCase());
}

export function extensionOf(name: string): string | null {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : null;
}

/** Le sélecteur ne filtre pas toujours (choix « Tous les fichiers ») : on revérifie l'extension. */
export function matchesOptions(name: string, { type = "any", allowedExtensions }: PickFilesOptions): boolean {
  if (type !== "custom") return true;
  const allowed = normalizeExtensions(allowedExtensions);
  const ext = extensionOf(name);
  return allowed.length === 0 || (ext !== null && allowed.includes(ext));
}
