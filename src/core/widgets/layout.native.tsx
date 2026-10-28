import { Children, createElement, type ReactElement, type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { textChild } from "./basic.native";
import {
  alignmentStyle,
  constraintsStyle,
  decorationStyle,
  insetsStyle,
  nativeSize,
  radiusStyle,
} from "./nativeStyle";
import {
  Alignment,
  crossAxisToCss,
  mainAxisToCss,
  type BorderRadius,
  type BoxConstraints,
  type BoxDecoration,
  type CrossAxisAlignment,
  type Dimension,
  type EdgeInsets,
  type MainAxisAlignment,
  type MainAxisSize,
} from "./painting";

// Widgets de mise en page sur mobile : des View React Native en flexbox.
// Mêmes noms et mêmes props que layout.tsx (web).

const view = (style: ViewStyle, ...children: ReactNode[]): ReactElement =>
  createElement(View, { style }, ...children.map(textChild));

// --- Container / SizedBox / Padding -----------------------------------------

export interface ContainerProps {
  width?: Dimension;
  height?: Dimension;
  padding?: EdgeInsets;
  margin?: EdgeInsets;
  color?: string;
  decoration?: BoxDecoration;
  constraints?: BoxConstraints;
  alignment?: Alignment;
  child?: ReactNode;
}

const FIT: Record<string, "cover" | "contain" | "fill" | "none" | "scale-down"> = {
  contain: "contain",
  cover: "cover",
  fill: "fill",
  none: "none",
  scaleDown: "scale-down",
};

/** Fond dessiné sous le contenu : dégradé, puis image. */
function background(decoration: BoxDecoration | undefined): ReactNode[] {
  const layers: ReactNode[] = [];
  const fill = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
  const gradient = decoration?.gradient;
  if (gradient?.type === "linear" && gradient.colors.length >= 2) {
    const point = (a: Alignment) => ({ x: (a.x + 1) / 2, y: (a.y + 1) / 2 });
    layers.push(
      createElement(ExpoLinearGradient, {
        key: "gradient",
        colors: gradient.colors as [string, string, ...string[]],
        locations: gradient.stops as [number, number, ...number[]] | undefined,
        start: point(gradient.begin),
        end: point(gradient.end),
        style: fill,
      })
    );
  } else if (gradient?.type === "radial") {
    console.warn("[better] RadialGradient n'est pas encore disponible sur mobile : couleur de fond utilisée.");
  }
  const image = decoration?.image;
  if (image) {
    const source = typeof image.image === "string" ? { uri: image.image } : image.image;
    layers.push(
      createElement(ExpoImage, {
        key: "image",
        source: source as never,
        contentFit: FIT[image.fit ?? "scaleDown"],
        style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
      })
    );
  }
  return layers;
}

/** Le style React Native d'un Container (réutilisé par AnimatedContainer). */
export function containerStyle({
  width,
  height,
  padding,
  margin,
  color,
  decoration,
  constraints,
  alignment,
}: Omit<ContainerProps, "child">): ViewStyle {
  const radialFallback =
    decoration?.gradient?.type === "radial" ? decoration.gradient.colors[0] : undefined;
  return {
    width: nativeSize(width),
    height: nativeSize(height),
    ...insetsStyle(padding, "padding"),
    ...insetsStyle(margin, "margin"),
    backgroundColor: color ?? radialFallback,
    ...decorationStyle(decoration),
    ...constraintsStyle(constraints),
    ...alignmentStyle(alignment),
    // Le fond (dégradé, image) ne dépasse pas des coins arrondis.
    ...((decoration?.gradient || decoration?.image) && { overflow: "hidden" }),
  };
}

/** La boîte à tout faire : taille, marges, fond, bordure, placement de l'enfant. */
export function Container({ child, ...style }: ContainerProps = {}): ReactElement {
  return view(containerStyle(style), ...background(style.decoration), child);
}

export interface SizedBoxProps {
  width?: Dimension;
  height?: Dimension;
  child?: ReactNode;
}

/** Boîte de taille fixe — ou simple espace vide entre deux widgets. */
export function SizedBox({ width, height, child }: SizedBoxProps = {}): ReactElement {
  return view({ width: nativeSize(width), height: nativeSize(height), flexShrink: 0 }, child);
}

SizedBox.expand = ({ child }: { child?: ReactNode } = {}) => SizedBox({ width: Infinity, height: Infinity, child });

export function Padding({ padding, child }: { padding: EdgeInsets; child?: ReactNode }): ReactElement {
  return view(insetsStyle(padding, "padding"), child);
}

/** Coupe l'enfant aux coins arrondis (image, vidéo…). */
export function ClipRRect({ borderRadius, child }: { borderRadius: BorderRadius; child?: ReactNode }): ReactElement {
  return view({ ...radiusStyle(borderRadius), overflow: "hidden" }, child);
}

// --- Center / Align ---------------------------------------------------------

/** Place l'enfant à `alignment` dans tout l'espace du parent. */
export function Align({ alignment, child }: { alignment: Alignment; child?: ReactNode }): ReactElement {
  return view({ flexGrow: 1, alignSelf: "stretch", ...alignmentStyle(alignment) }, child);
}

/** Centre l'enfant dans tout l'espace du parent. */
export function Center({ child }: { child?: ReactNode } = {}): ReactElement {
  return Align({ alignment: Alignment.center, child });
}

// --- Row / Column -----------------------------------------------------------

export interface FlexProps {
  mainAxisAlignment?: MainAxisAlignment;
  crossAxisAlignment?: CrossAxisAlignment;
  mainAxisSize?: MainAxisSize;
  spacing?: number;
  children?: ReactNode[];
}

function flex(
  direction: "row" | "column",
  { mainAxisAlignment = "start", crossAxisAlignment = "center", mainAxisSize, spacing, children = [] }: FlexProps
): ReactElement {
  const isRow = direction === "row";
  return view(
    {
      flexDirection: direction,
      justifyContent: mainAxisToCss[mainAxisAlignment] as ViewStyle["justifyContent"],
      alignItems: crossAxisToCss[crossAxisAlignment] as ViewStyle["alignItems"],
      gap: spacing,
      // max : prend toute la place sur l'axe principal ; min (Row) : sa taille naturelle.
      ...(mainAxisSize === "max" && (isRow ? { alignSelf: "stretch" } : { flexGrow: 1 })),
      ...(mainAxisSize === "min" && isRow && { alignSelf: "flex-start" }),
    },
    ...children
  );
}

/** Enfants côte à côte, horizontalement. */
export function Row(props: FlexProps = {}): ReactElement {
  return flex("row", props);
}

/** Enfants les uns sous les autres, verticalement. */
export function Column(props: FlexProps = {}): ReactElement {
  return flex("column", props);
}

// --- Expanded / Flexible / Spacer -------------------------------------------

/** Dans un Row / Column : l'enfant prend l'espace restant (partagé selon `flex`). */
export function Expanded({ flex = 1, child }: { flex?: number; child?: ReactNode }): ReactElement {
  return view({ flex, minWidth: 0, minHeight: 0, alignSelf: "stretch" }, child);
}

export const FlexFit = { tight: "tight", loose: "loose" } as const;
export type FlexFit = (typeof FlexFit)[keyof typeof FlexFit];

/** Comme Expanded, mais l'enfant peut rester plus petit que l'espace (`fit: loose`, par défaut). */
export function Flexible({
  flex = 1,
  fit = "loose",
  child,
}: {
  flex?: number;
  fit?: FlexFit;
  child?: ReactNode;
}): ReactElement {
  if (fit === "tight") return Expanded({ flex, child });
  return view({ flexShrink: 1, minWidth: 0, minHeight: 0 }, child);
}

/** Espace vide extensible entre deux enfants d'un Row / Column. */
export function Spacer({ flex = 1 }: { flex?: number } = {}): ReactElement {
  return view({ flex });
}

// --- Wrap -------------------------------------------------------------------

export const WrapAlignment = {
  start: "start",
  end: "end",
  center: "center",
  spaceBetween: "spaceBetween",
  spaceAround: "spaceAround",
  spaceEvenly: "spaceEvenly",
} as const;
export type WrapAlignment = (typeof WrapAlignment)[keyof typeof WrapAlignment];

/** Enfants en ligne, qui passent à la ligne suivante quand la place manque. */
export function Wrap({
  alignment = "start",
  spacing = 0,
  runSpacing = 0,
  children = [],
}: {
  alignment?: WrapAlignment;
  spacing?: number;
  runSpacing?: number;
  children?: ReactNode[];
} = {}): ReactElement {
  return view(
    {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: mainAxisToCss[alignment] as ViewStyle["justifyContent"],
      columnGap: spacing,
      rowGap: runSpacing,
    },
    ...children
  );
}

// --- Stack / Positioned -----------------------------------------------------

export const StackFit = { loose: "loose", expand: "expand" } as const;
export type StackFit = (typeof StackFit)[keyof typeof StackFit];

/**
 * Enfants superposés (le premier en dessous). Le premier enfant donne sa
 * taille au Stack ; les suivants sont superposés sur toute sa surface et
 * placés selon `alignment`. Les `Positioned` le sont par rapport au Stack.
 */
export function Stack({
  alignment = Alignment.topLeft,
  fit = "loose",
  children = [],
}: {
  alignment?: Alignment;
  fit?: StackFit;
  children?: ReactNode[];
} = {}): ReactElement {
  const [first, ...others] = Children.toArray(children);
  const overlay: ViewStyle = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...(fit === "expand" ? { alignItems: "stretch", justifyContent: "flex-start" } : alignmentStyle(alignment)),
  };
  return createElement(
    View,
    { style: { position: "relative", ...(fit === "expand" && { flexGrow: 1, alignSelf: "stretch" }) } },
    textChild(first),
    // box-none : les zones vides du calque laissent passer les touchers.
    ...others.map((child, index) =>
      createElement(View, { key: index, style: overlay, pointerEvents: "box-none" }, textChild(child))
    )
  );
}

export interface PositionedProps {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  width?: Dimension;
  height?: Dimension;
  child?: ReactNode;
}

/** Dans un Stack : enfant placé à des distances précises des bords du Stack. */
export function Positioned({ left, top, right, bottom, width, height, child }: PositionedProps): ReactElement {
  return view({ position: "absolute", left, top, right, bottom, width: nativeSize(width), height: nativeSize(height) }, child);
}

/** Dans un Stack : enfant étiré sur toute la surface du Stack. */
Positioned.fill = ({ child }: { child?: ReactNode } = {}) => Positioned({ left: 0, top: 0, right: 0, bottom: 0, child });
