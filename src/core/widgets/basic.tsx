import { createElement, type CSSProperties, type ReactElement } from "react";
import MuiDivider from "@mui/material/Divider";
import { registeredIcon, type IconName, type WebIconComponent } from "./icons";
import { textStyleToCss, type TextAlign, type TextStyle } from "./painting";

// --- Text -------------------------------------------------------------------

export const TextOverflow = { clip: "clip", ellipsis: "ellipsis", visible: "visible" } as const;
export type TextOverflow = (typeof TextOverflow)[keyof typeof TextOverflow];

export interface TextOptions {
  style?: TextStyle;
  textAlign?: TextAlign;
  /** Nombre de lignes max ; au-delà, le texte est coupé (voir `overflow`). */
  maxLines?: number;
  overflow?: TextOverflow;
  /** `false` : pas de retour à la ligne. */
  softWrap?: boolean;
}

/** Du texte : `Text("Bonjour", { style: { fontSize: 20 } })`. */
export function Text(
  data: string | number,
  { style, textAlign, maxLines, overflow = "clip", softWrap = true }: TextOptions = {}
): ReactElement {
  const css: CSSProperties = {
    display: "block",
    margin: 0,
    textAlign,
    whiteSpace: softWrap ? undefined : "nowrap",
    ...textStyleToCss(style),
  };

  if (maxLines !== undefined || !softWrap) {
    css.overflow = overflow === "visible" ? "visible" : "hidden";
    if (overflow === "ellipsis") css.textOverflow = "ellipsis";
  }
  if (maxLines !== undefined && maxLines > 1) {
    css.display = "-webkit-box";
    css.WebkitBoxOrient = "vertical";
    css.WebkitLineClamp = maxLines;
  } else if (maxLines === 1) {
    css.whiteSpace = "nowrap";
  }

  return createElement("span", { style: css }, data);
}

// --- Icon -------------------------------------------------------------------

/**
 * Une icône : son nom (`Icons.add`, fonctionne sur le web et sur mobile), ou
 * un composant MUI importé directement (web uniquement).
 */
export type IconData = IconName | WebIconComponent;

const warned = new Set<string>();

/** `Icon(Icons.add, { size: 32, color: "red" })`. */
export function Icon(
  icon: IconData,
  { size, color }: { size?: number; color?: string } = {}
): ReactElement {
  const style = { fontSize: size, color };
  if (typeof icon !== "string") return createElement(icon, { style });

  const component = registeredIcon(icon);
  if (component) return createElement(component, { style });
  // Nom calculé à l'exécution (pas écrit `Icons.xxx`) : la CLI ne l'a pas vu.
  if (process.env.NODE_ENV !== "production" && !warned.has(icon)) {
    warned.add(icon);
    console.warn(
      `[better] Icône "${icon}" non enregistrée : écrivez Icons.${icon} en toutes lettres dans lib/ pour que la CLI l'inclue.`
    );
  }
  // Emplacement vide de la bonne taille, pour ne pas décaler la mise en page.
  return createElement("span", { style: { display: "inline-block", width: size ?? 24, height: size ?? 24 } });
}

// --- Divider ----------------------------------------------------------------

/** Ligne de séparation horizontale. */
export function Divider({
  height,
  thickness,
  color,
}: {
  /** Espace vertical total occupé (la ligne est au milieu). */
  height?: number;
  thickness?: number;
  color?: string;
} = {}): ReactElement {
  const margin = height !== undefined ? (height - (thickness ?? 1)) / 2 : undefined;
  return createElement(MuiDivider, {
    style: { marginTop: margin, marginBottom: margin, borderBottomWidth: thickness, borderColor: color },
  });
}
