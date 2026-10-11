import { createElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import {
  Alignment,
  constraintsToCss,
  crossAxisToCss,
  decorationToCss,
  mainAxisToCss,
  toCssSize,
  type BorderRadius,
  type BoxConstraints,
  type BoxDecoration,
  type CrossAxisAlignment,
  type Dimension,
  type EdgeInsets,
  type MainAxisAlignment,
  type MainAxisSize,
} from "./painting";

// Widgets de mise en page : de simples <div> en CSS flex, sans MUI.
// `children` est passé en arguments à createElement : pas besoin de `key`.

const div = (style: CSSProperties, ...children: ReactNode[]): ReactElement =>
  createElement("div", { style }, ...children);

// --- Container / SizedBox / Padding -----------------------------------------

export interface ContainerProps {
  width?: Dimension;
  height?: Dimension;
  padding?: EdgeInsets;
  margin?: EdgeInsets;
  /** Raccourci pour `decoration.color`. */
  color?: string;
  decoration?: BoxDecoration;
  constraints?: BoxConstraints;
  /** Position de l'enfant dans le conteneur. */
  alignment?: Alignment;
  child?: ReactNode;
}

/** La boîte à tout faire : taille, marges, fond, bordure, placement de l'enfant. */
export function Container({ child, ...style }: ContainerProps = {}): ReactElement {
  return div(containerStyle(style), child);
}

/** Le style CSS d'un Container (réutilisé par AnimatedContainer). */
export function containerStyle({
  width,
  height,
  padding,
  margin,
  color,
  decoration,
  constraints,
  alignment,
}: Omit<ContainerProps, "child">): CSSProperties {
  return {
    boxSizing: "border-box",
    width: toCssSize(width),
    height: toCssSize(height),
    padding: padding?.toCss(),
    margin: margin?.toCss(),
    backgroundColor: color,
    ...decorationToCss(decoration),
    ...constraintsToCss(constraints),
    ...alignment?.toFlexCss(),
  };
}

export interface SizedBoxProps {
  width?: Dimension;
  height?: Dimension;
  child?: ReactNode;
}

/** Boîte de taille fixe — ou simple espace vide entre deux widgets. */
export function SizedBox({ width, height, child }: SizedBoxProps = {}): ReactElement {
  return div(
    { boxSizing: "border-box", width: toCssSize(width), height: toCssSize(height), flexShrink: 0 },
    child
  );
}

/** Prend toute la place disponible. */
SizedBox.expand = ({ child }: { child?: ReactNode } = {}) =>
  SizedBox({ width: Infinity, height: Infinity, child });

export function Padding({ padding, child }: { padding: EdgeInsets; child?: ReactNode }): ReactElement {
  return div({ boxSizing: "border-box", padding: padding.toCss() }, child);
}

/** Coupe l'enfant aux coins arrondis (image, vidéo…). */
export function ClipRRect({
  borderRadius,
  child,
}: {
  borderRadius: BorderRadius;
  child?: ReactNode;
}): ReactElement {
  return div({ borderRadius: borderRadius.toCss(), overflow: "hidden" }, child);
}

// --- Center / Align ---------------------------------------------------------

/** Place l'enfant à `alignment` dans tout l'espace du parent. */
export function Align({ alignment, child }: { alignment: Alignment; child?: ReactNode }): ReactElement {
  return div({ width: "100%", height: "100%", ...alignment.toFlexCss() }, child);
}

/** Centre l'enfant dans tout l'espace du parent. */
export function Center({ child }: { child?: ReactNode } = {}): ReactElement {
  return div(
    { width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" },
    child
  );
}

// --- Row / Column -----------------------------------------------------------

export interface FlexProps {
  mainAxisAlignment?: MainAxisAlignment;
  /** Par défaut `center`, comme en Flutter. */
  crossAxisAlignment?: CrossAxisAlignment;
  mainAxisSize?: MainAxisSize;
  /** Espace entre chaque enfant, en px. */
  spacing?: number;
  children?: ReactNode[];
}

function flex(
  direction: "row" | "column",
  { mainAxisAlignment = "start", crossAxisAlignment = "center", mainAxisSize, spacing, children = [] }: FlexProps
): ReactElement {
  const isRow = direction === "row";
  return div(
    {
      display: isRow && mainAxisSize === "min" ? "inline-flex" : "flex",
      flexDirection: direction,
      justifyContent: mainAxisToCss[mainAxisAlignment],
      alignItems: crossAxisToCss[crossAxisAlignment],
      gap: spacing,
      ...(mainAxisSize === "max" && (isRow ? { width: "100%" } : { height: "100%" })),
      boxSizing: "border-box",
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

/**
 * Dans un Row / Column : l'enfant prend l'espace restant (partagé selon `flex`).
 * L'enfant est étiré sur toute la surface — un ListView dedans devient scrollable.
 */
export function Expanded({ flex = 1, child }: { flex?: number; child?: ReactNode }): ReactElement {
  return div(
    { flex: `${flex} 1 0%`, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" },
    child
  );
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
  // Approximation CSS : l'enfant garde sa taille naturelle et peut seulement rétrécir.
  return div({ flex: "0 1 auto", minWidth: 0, minHeight: 0 }, child);
}

/** Espace vide extensible entre deux enfants d'un Row / Column. */
export function Spacer({ flex = 1 }: { flex?: number } = {}): ReactElement {
  return div({ flex: `${flex} 1 0%` });
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
  /** Espace horizontal entre les enfants. */
  spacing?: number;
  /** Espace vertical entre les lignes. */
  runSpacing?: number;
  children?: ReactNode[];
} = {}): ReactElement {
  return div(
    {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: mainAxisToCss[alignment],
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
 * Enfants superposés (le premier en dessous). Les enfants non positionnés sont
 * placés selon `alignment` ; les `Positioned` le sont par rapport au Stack.
 */
export function Stack({
  alignment = Alignment.topLeft,
  fit = "loose",
  children = [],
}: {
  alignment?: Alignment;
  /** `expand` : le Stack et ses enfants non positionnés remplissent le parent. */
  fit?: StackFit;
  children?: ReactNode[];
} = {}): ReactElement {
  const place = (v: number) => (v < 0 ? "start" : v > 0 ? "end" : "center");
  // Grille à une seule cellule : tous les enfants s'empilent dans la même case.
  const cell: CSSProperties = {
    gridArea: "1 / 1",
    justifySelf: fit === "expand" ? "stretch" : place(alignment.x),
    alignSelf: fit === "expand" ? "stretch" : place(alignment.y),
  };
  return div(
    {
      position: "relative",
      display: "grid",
      ...(fit === "expand" && { width: "100%", height: "100%" }),
    },
    ...children.map((child) => div(cell, child))
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
  return div(
    { position: "absolute", left, top, right, bottom, width: toCssSize(width), height: toCssSize(height) },
    child
  );
}

/** Dans un Stack : enfant étiré sur toute la surface du Stack. */
Positioned.fill = ({ child }: { child?: ReactNode } = {}) =>
  Positioned({ left: 0, top: 0, right: 0, bottom: 0, child });
