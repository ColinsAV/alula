import { createElement, type ComponentType, type CSSProperties, type ReactElement } from "react";
import MuiDivider from "@mui/material/Divider";
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

/** Une icône MUI : `import AddIcon from "@mui/icons-material/Add"`. */
export type IconData = ComponentType<{ style?: CSSProperties }>;

/** `Icon(AddIcon, { size: 32, color: "red" })` — icônes de `@mui/icons-material`. */
export function Icon(
  icon: IconData,
  { size, color }: { size?: number; color?: string } = {}
): ReactElement {
  return createElement(icon, { style: { fontSize: size, color } });
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
