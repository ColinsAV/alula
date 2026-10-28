import type { ViewStyle } from "react-native";
import type {
  Alignment,
  BorderRadius,
  BoxConstraints,
  BoxDecoration,
  Dimension,
  EdgeInsets,
  TextStyle,
} from "./painting";

// Conversion des valeurs de painting.ts en styles React Native.
// Importé uniquement par les fichiers `.native.tsx`.

/** `Infinity` (toute la place) → "100%". */
export const nativeSize = (value: Dimension | undefined): ViewStyle["width"] =>
  value === undefined ? undefined : value === Infinity ? "100%" : value;

export function insetsStyle(insets: EdgeInsets | undefined, kind: "padding" | "margin"): ViewStyle {
  if (!insets) return {};
  return {
    [`${kind}Top`]: insets.top,
    [`${kind}Right`]: insets.right,
    [`${kind}Bottom`]: insets.bottom,
    [`${kind}Left`]: insets.left,
  };
}

export function radiusStyle(radius: BorderRadius | undefined): ViewStyle {
  if (!radius) return {};
  return {
    borderTopLeftRadius: radius.topLeft,
    borderTopRightRadius: radius.topRight,
    borderBottomRightRadius: radius.bottomRight,
    borderBottomLeftRadius: radius.bottomLeft,
  };
}

/** Couleur, coins, bordure et ombres. Dégradé et image : voir layout.native.tsx. */
export function decorationStyle(decoration: BoxDecoration | undefined): ViewStyle {
  if (!decoration) return {};
  return {
    backgroundColor: decoration.color,
    ...radiusStyle(decoration.borderRadius),
    ...(decoration.border && { borderWidth: decoration.border.width, borderColor: decoration.border.color }),
    ...(decoration.boxShadow && {
      boxShadow: decoration.boxShadow.map(
        ({ color = "rgba(0,0,0,0.2)", offset = { dx: 0, dy: 0 }, blurRadius = 0, spreadRadius = 0 }) => ({
          offsetX: offset.dx,
          offsetY: offset.dy,
          blurRadius,
          spreadDistance: spreadRadius,
          color,
        })
      ),
    }),
  };
}

export function constraintsStyle(constraints: BoxConstraints | undefined): ViewStyle {
  if (!constraints) return {};
  return {
    minWidth: nativeSize(constraints.minWidth) as ViewStyle["minWidth"],
    maxWidth: nativeSize(constraints.maxWidth) as ViewStyle["maxWidth"],
    minHeight: nativeSize(constraints.minHeight) as ViewStyle["minHeight"],
    maxHeight: nativeSize(constraints.maxHeight) as ViewStyle["maxHeight"],
  };
}

const place = (v: number) => (v < 0 ? "flex-start" : v > 0 ? "flex-end" : "center");

/** Place l'enfant d'une View (en colonne, le défaut de React Native) à `alignment`. */
export function alignmentStyle(alignment: Alignment | undefined): ViewStyle {
  if (!alignment) return {};
  return { justifyContent: place(alignment.y), alignItems: place(alignment.x) };
}

/** TextStyle façon Flutter → style de Text React Native. */
export function textStyle(style: TextStyle | undefined) {
  if (!style) return {};
  const fontSize = style.fontSize;
  return {
    fontSize,
    fontWeight: style.fontWeight !== undefined ? (String(style.fontWeight) as "400") : undefined,
    fontStyle: style.fontStyle,
    color: style.color,
    letterSpacing: style.letterSpacing,
    // Flutter : hauteur de ligne en multiple de la taille ; React Native : en px.
    lineHeight: style.height !== undefined ? style.height * (fontSize ?? 14) : undefined,
    textDecorationLine:
      style.decoration === "lineThrough" ? ("line-through" as const) : style.decoration === "overline" ? undefined : style.decoration,
    fontFamily: style.fontFamily,
  };
}
