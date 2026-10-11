import type { CSSProperties } from "react";

// Types de base façon Flutter (painting / rendering), convertis en CSS.

/** Une dimension : nombre en px, `Infinity` (= `double.infinity`, 100 %) ou valeur CSS. */
export type Dimension = number | string;

/** Convertit une `Dimension` en valeur CSS. */
export function toCssSize(value: Dimension | undefined): string | number | undefined {
  if (value === undefined) return undefined;
  if (value === Infinity) return "100%";
  return value;
}

// --- EdgeInsets -------------------------------------------------------------

/** Marges intérieures / extérieures — comme `EdgeInsets` en Flutter. */
export class EdgeInsets {
  private constructor(
    readonly top: number,
    readonly right: number,
    readonly bottom: number,
    readonly left: number
  ) {}

  static readonly zero = new EdgeInsets(0, 0, 0, 0);

  static all(value: number): EdgeInsets {
    return new EdgeInsets(value, value, value, value);
  }

  static symmetric({ vertical = 0, horizontal = 0 }: { vertical?: number; horizontal?: number }) {
    return new EdgeInsets(vertical, horizontal, vertical, horizontal);
  }

  static only({
    top = 0,
    right = 0,
    bottom = 0,
    left = 0,
  }: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }) {
    return new EdgeInsets(top, right, bottom, left);
  }

  /** `fromLTRB(left, top, right, bottom)`, l'ordre de Flutter. */
  static fromLTRB(left: number, top: number, right: number, bottom: number) {
    return new EdgeInsets(top, right, bottom, left);
  }

  toCss(): string {
    return `${this.top}px ${this.right}px ${this.bottom}px ${this.left}px`;
  }
}

// --- BorderRadius / Border / BoxShadow / BoxDecoration ----------------------

export class BorderRadius {
  private constructor(
    readonly topLeft: number,
    readonly topRight: number,
    readonly bottomRight: number,
    readonly bottomLeft: number
  ) {}

  static readonly zero = new BorderRadius(0, 0, 0, 0);

  static circular(radius: number): BorderRadius {
    return new BorderRadius(radius, radius, radius, radius);
  }

  static only({
    topLeft = 0,
    topRight = 0,
    bottomRight = 0,
    bottomLeft = 0,
  }: {
    topLeft?: number;
    topRight?: number;
    bottomRight?: number;
    bottomLeft?: number;
  }) {
    return new BorderRadius(topLeft, topRight, bottomRight, bottomLeft);
  }

  toCss(): string {
    return `${this.topLeft}px ${this.topRight}px ${this.bottomRight}px ${this.bottomLeft}px`;
  }
}

export class Border {
  private constructor(readonly css: string) {}

  /** Bordure identique sur les 4 côtés. */
  static all({ color = "currentColor", width = 1 }: { color?: string; width?: number } = {}) {
    return new Border(`${width}px solid ${color}`);
  }
}

export interface BoxShadow {
  color?: string;
  offset?: { dx: number; dy: number };
  blurRadius?: number;
  spreadRadius?: number;
}

export interface BoxDecoration {
  color?: string;
  borderRadius?: BorderRadius;
  border?: Border;
  boxShadow?: BoxShadow[];
  /** Dégradé ou image CSS (`linear-gradient(...)`, `url(...)`). */
  backgroundImage?: string;
}

/** Fabrique façon Flutter : `BoxDecoration({ color: "#eef", borderRadius: BorderRadius.circular(8) })`. */
export function BoxDecoration(decoration: BoxDecoration): BoxDecoration {
  return decoration;
}

export function decorationToCss(decoration: BoxDecoration | undefined): CSSProperties {
  if (!decoration) return {};
  return {
    backgroundColor: decoration.color,
    backgroundImage: decoration.backgroundImage,
    borderRadius: decoration.borderRadius?.toCss(),
    border: decoration.border?.css,
    boxShadow: decoration.boxShadow
      ?.map(
        ({ color = "rgba(0,0,0,0.2)", offset = { dx: 0, dy: 0 }, blurRadius = 0, spreadRadius = 0 }) =>
          `${offset.dx}px ${offset.dy}px ${blurRadius}px ${spreadRadius}px ${color}`
      )
      .join(", "),
  };
}

// --- BoxConstraints ---------------------------------------------------------

export interface BoxConstraints {
  minWidth?: Dimension;
  maxWidth?: Dimension;
  minHeight?: Dimension;
  maxHeight?: Dimension;
}

export function BoxConstraints(constraints: BoxConstraints): BoxConstraints {
  return constraints;
}

export function constraintsToCss(constraints: BoxConstraints | undefined): CSSProperties {
  if (!constraints) return {};
  return {
    minWidth: toCssSize(constraints.minWidth),
    maxWidth: toCssSize(constraints.maxWidth),
    minHeight: toCssSize(constraints.minHeight),
    maxHeight: toCssSize(constraints.maxHeight),
  };
}

// --- Alignements ------------------------------------------------------------

/** Placement le long de l'axe principal d'un Row / Column. */
export const MainAxisAlignment = {
  start: "start",
  end: "end",
  center: "center",
  spaceBetween: "spaceBetween",
  spaceAround: "spaceAround",
  spaceEvenly: "spaceEvenly",
} as const;
export type MainAxisAlignment = (typeof MainAxisAlignment)[keyof typeof MainAxisAlignment];

/** Placement le long de l'axe secondaire d'un Row / Column. */
export const CrossAxisAlignment = {
  start: "start",
  end: "end",
  center: "center",
  stretch: "stretch",
  baseline: "baseline",
} as const;
export type CrossAxisAlignment = (typeof CrossAxisAlignment)[keyof typeof CrossAxisAlignment];

/**
 * Taille sur l'axe principal. `max` : prend toute la place (le parent doit
 * avoir une taille). Par défaut, un Row prend toute la largeur et un Column
 * la hauteur de son contenu, comme en CSS.
 */
export const MainAxisSize = { min: "min", max: "max" } as const;
export type MainAxisSize = (typeof MainAxisSize)[keyof typeof MainAxisSize];

export const Axis = { horizontal: "horizontal", vertical: "vertical" } as const;
export type Axis = (typeof Axis)[keyof typeof Axis];

export const mainAxisToCss: Record<MainAxisAlignment, CSSProperties["justifyContent"]> = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  spaceBetween: "space-between",
  spaceAround: "space-around",
  spaceEvenly: "space-evenly",
};

export const crossAxisToCss: Record<CrossAxisAlignment, CSSProperties["alignItems"]> = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  stretch: "stretch",
  baseline: "baseline",
};

/** Position d'un enfant dans son parent : x et y de -1 (début) à 1 (fin), comme en Flutter. */
export class Alignment {
  constructor(
    readonly x: number,
    readonly y: number
  ) {}

  static readonly topLeft = new Alignment(-1, -1);
  static readonly topCenter = new Alignment(0, -1);
  static readonly topRight = new Alignment(1, -1);
  static readonly centerLeft = new Alignment(-1, 0);
  static readonly center = new Alignment(0, 0);
  static readonly centerRight = new Alignment(1, 0);
  static readonly bottomLeft = new Alignment(-1, 1);
  static readonly bottomCenter = new Alignment(0, 1);
  static readonly bottomRight = new Alignment(1, 1);

  /** Propriétés flex qui placent l'enfant d'un conteneur à cet endroit. */
  toFlexCss(): CSSProperties {
    const place = (v: number) => (v < 0 ? "flex-start" : v > 0 ? "flex-end" : "center");
    return { display: "flex", justifyContent: place(this.x), alignItems: place(this.y) };
  }
}

// --- Texte ------------------------------------------------------------------

export const FontWeight = {
  w100: 100,
  w200: 200,
  w300: 300,
  w400: 400,
  w500: 500,
  w600: 600,
  w700: 700,
  w800: 800,
  w900: 900,
  normal: 400,
  bold: 700,
} as const;

export interface TextStyle {
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  color?: string;
  letterSpacing?: number;
  /** Hauteur de ligne, en multiple de la taille de police (comme en Flutter). */
  height?: number;
  decoration?: "none" | "underline" | "lineThrough" | "overline";
  fontFamily?: string;
}

export function TextStyle(style: TextStyle): TextStyle {
  return style;
}

export function textStyleToCss(style: TextStyle | undefined): CSSProperties {
  if (!style) return {};
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color,
    letterSpacing: style.letterSpacing,
    lineHeight: style.height,
    textDecoration: style.decoration === "lineThrough" ? "line-through" : style.decoration,
    fontFamily: style.fontFamily,
  };
}

export const TextAlign = {
  left: "left",
  right: "right",
  center: "center",
  justify: "justify",
  start: "start",
  end: "end",
} as const;
export type TextAlign = (typeof TextAlign)[keyof typeof TextAlign];
