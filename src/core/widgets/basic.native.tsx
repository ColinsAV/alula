import { createContext, createElement, useContext, type ReactElement, type ReactNode } from "react";
import { Text as RNText, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNativeTheme } from "../theme/nativeTheme";
import type { IconName, WebIconComponent } from "./icons";
import { textStyle } from "./nativeStyle";
import type { TextAlign, TextStyle } from "./painting";

// Text, Icon et Divider sur mobile (React Native).

// --- DefaultTextStyle -------------------------------------------------------

/**
 * Style de texte et couleur d'icône hérités par les widgets en dessous, comme
 * `DefaultTextStyle` / `IconTheme` en Flutter (ex. texte clair dans l'AppBar).
 * Sur le web, c'est le CSS qui fait hériter la couleur.
 */
export const DefaultTextStyle = createContext<TextStyle>({});

/** Applique `style` (fusionné avec celui du dessus) au texte de `child`. */
export function DefaultTextStyleScope({ style, children }: { style: TextStyle; children?: ReactNode }) {
  const parent = useContext(DefaultTextStyle);
  return createElement(DefaultTextStyle.Provider, { value: { ...parent, ...style } }, children);
}

/** Enveloppe le texte nu dans un Text : React Native interdit le texte hors d'un Text. */
export function textChild(child: ReactNode): ReactNode {
  return typeof child === "string" || typeof child === "number" ? Text(child) : child;
}

// --- Text -------------------------------------------------------------------

export const TextOverflow = { clip: "clip", ellipsis: "ellipsis", visible: "visible" } as const;
export type TextOverflow = (typeof TextOverflow)[keyof typeof TextOverflow];

export interface TextOptions {
  style?: TextStyle;
  textAlign?: TextAlign;
  maxLines?: number;
  overflow?: TextOverflow;
  softWrap?: boolean;
}

const ALIGN: Record<TextAlign, "left" | "right" | "center" | "justify"> = {
  left: "left",
  right: "right",
  center: "center",
  justify: "justify",
  start: "left",
  end: "right",
};

/** Du texte : `Text("Bonjour", { style: { fontSize: 20 } })`. */
export function Text(data: string | number, options: TextOptions = {}): ReactElement {
  return createElement(TextView, { data, options });
}

function TextView({ data, options }: { data: string | number; options: TextOptions }) {
  const { colorScheme } = useNativeTheme().data;
  const inherited = useContext(DefaultTextStyle);
  const { style, textAlign, maxLines, overflow = "clip", softWrap = true } = options;
  return createElement(
    RNText,
    {
      numberOfLines: maxLines ?? (softWrap ? undefined : 1),
      ellipsizeMode: overflow === "ellipsis" ? "tail" : "clip",
      style: {
        color: colorScheme.onSurface,
        fontSize: 14,
        ...textStyle({ ...inherited, ...style }),
        textAlign: textAlign && ALIGN[textAlign],
      },
    },
    data
  );
}

// --- Icon -------------------------------------------------------------------

/** Une icône : son nom (`Icons.add`). Les composants MUI ne marchent que sur le web. */
export type IconData = IconName | WebIconComponent;

const VARIANT = /_(outlined|rounded|sharp|two_tone)$/;
const warned = new Set<string>();

/**
 * Nom de la police Material Icons : `arrow_back` → `arrow-back`. Les variantes
 * (`_outlined`…) n'existent pas dans cette police : on prend l'icône de base.
 */
function glyphName(name: string): string | undefined {
  const glyph = name.replace(VARIANT, "").replace(/_/g, "-");
  return glyph in MaterialIcons.glyphMap ? glyph : undefined;
}

/** `Icon(Icons.add, { size: 32, color: "red" })`. */
export function Icon(icon: IconData, options: { size?: number; color?: string } = {}): ReactElement {
  return createElement(IconView, { icon, ...options });
}

function IconView({ icon, size = 24, color }: { icon: IconData; size?: number; color?: string }) {
  const { colorScheme } = useNativeTheme().data;
  const inherited = useContext(DefaultTextStyle);
  const glyph = typeof icon === "string" ? glyphName(icon) : undefined;
  if (!glyph) {
    const label = typeof icon === "string" ? icon : "(composant MUI)";
    if (!warned.has(label)) {
      warned.add(label);
      console.warn(`[better] Icône ${label} indisponible sur mobile.`);
    }
    return createElement(View, { style: { width: size, height: size } });
  }
  return createElement(MaterialIcons, {
    name: glyph as keyof typeof MaterialIcons.glyphMap,
    size,
    color: color ?? inherited.color ?? colorScheme.onSurfaceVariant,
  });
}

// --- Divider ----------------------------------------------------------------

/** Ligne de séparation horizontale. */
export function Divider({
  height,
  thickness = 1,
  color,
}: { height?: number; thickness?: number; color?: string } = {}): ReactElement {
  return createElement(DividerView, { height, thickness, color });
}

function DividerView({ height, thickness, color }: { height?: number; thickness: number; color?: string }) {
  const { colorScheme } = useNativeTheme().data;
  const margin = height !== undefined ? (height - thickness) / 2 : 0;
  return createElement(View, {
    style: { height: thickness, marginVertical: margin, backgroundColor: color ?? colorScheme.outline, alignSelf: "stretch" },
  });
}
