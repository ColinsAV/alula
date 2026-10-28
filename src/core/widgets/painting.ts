import type { CSSProperties } from "react";

// Types de base façon Flutter (painting / rendering), convertis en CSS.
//
// L'API publique ne contient que des valeurs (nombres, couleurs, alignements),
// jamais de CSS : chaque plateforme fait sa propre conversion (ici le web ;
// plus tard React Native).

/**
 * Une dimension en px, ou `Infinity` (= `double.infinity`) pour prendre toute
 * la place du parent. Pas de valeur CSS (`"100vh"`…) : elle n'existe pas sur mobile.
 */
export type Dimension = number;

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
  private constructor(
    readonly width: number,
    readonly color: string
  ) {}

  /** Bordure identique sur les 4 côtés. */
  static all({ color = "currentColor", width = 1 }: { color?: string; width?: number } = {}) {
    return new Border(width, color);
  }

  toCss(): string {
    return `${this.width}px solid ${this.color}`;
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
  /** Dégradé de fond (remplace `color`) : `LinearGradient(...)`, `RadialGradient(...)`. */
  gradient?: Gradient;
  /** Image de fond, au-dessus de la couleur ou du dégradé : `DecorationImage(...)`. */
  image?: DecorationImage;
}

// --- Images ------------------------------------------------------------------

/** Comment une image remplit sa boîte, comme `BoxFit` en Flutter. */
export const BoxFit = {
  /** Toute l'image visible, quitte à laisser des bandes vides. */
  contain: "contain",
  /** Remplit la boîte, quitte à rogner l'image. */
  cover: "cover",
  /** Remplit la boîte en déformant l'image. */
  fill: "fill",
  /** Taille d'origine, centrée, rognée si trop grande. */
  none: "none",
  /** Comme `none`, mais réduite (comme `contain`) si elle ne rentre pas. */
  scaleDown: "scaleDown",
} as const;
export type BoxFit = (typeof BoxFit)[keyof typeof BoxFit];

/** Image importée dans le code : `import hero from "./hero.jpg"`. */
export interface StaticImage {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

/**
 * Source d'une image :
 * - `import hero from "./hero.jpg"` (recommandé : fonctionne sur le web et sur mobile,
 *   et Next connaît la taille de l'image) ;
 * - un chemin dans `public/` (`"images/hero.jpg"`) : web uniquement.
 *
 * Le `number` correspond à un import d'image sous React Native.
 */
export type ImageSource = StaticImage | string | number;

/** URL web d'une source d'image. */
export function imageSourceUrl(source: ImageSource): string {
  if (typeof source === "number") {
    throw new Error("Image importée pour React Native : non disponible sur le web.");
  }
  if (typeof source === "object") return source.src;
  return source.startsWith("/") || /^[a-z]+:/i.test(source) ? source : `/${source}`;
}

/** Pourcentage CSS d'une coordonnée d'Alignment (-1 → 0 %, 1 → 100 %). */
const alignmentPercent = (v: number) => `${((v + 1) / 2) * 100}%`;

/** Position CSS (`x% y%`) d'un Alignment. */
export function alignmentToCssPosition(alignment: Alignment): string {
  return `${alignmentPercent(alignment.x)} ${alignmentPercent(alignment.y)}`;
}

/** Image de fond d'une BoxDecoration, comme `DecorationImage` en Flutter. */
export interface DecorationImage {
  image: ImageSource;
  /** Par défaut `scaleDown`, comme en Flutter. */
  fit?: BoxFit;
  /** Par défaut au centre. */
  alignment?: Alignment;
}

export function DecorationImage(image: DecorationImage): DecorationImage {
  return image;
}

const backgroundSize: Record<BoxFit, string> = {
  contain: "contain",
  cover: "cover",
  fill: "100% 100%",
  none: "auto",
  // Approximation CSS : pas d'équivalent exact de scaleDown en arrière-plan.
  scaleDown: "contain",
};

function decorationImageCss({ fit = "scaleDown", alignment }: DecorationImage) {
  return {
    size: backgroundSize[fit],
    position: alignment ? alignmentToCssPosition(alignment) : "center",
    repeat: "no-repeat",
  };
}

// --- Dégradés ---------------------------------------------------------------

/** Dégradé linéaire, comme `LinearGradient` en Flutter. */
export interface LinearGradient {
  type: "linear";
  colors: string[];
  /** Position de chaque couleur, de 0 à 1. Par défaut, réparties régulièrement. */
  stops?: number[];
  begin: Alignment;
  end: Alignment;
}

/**
 * `LinearGradient({ colors: ["#6366f1", "#ec4899"], begin: Alignment.topLeft, end: Alignment.bottomRight })`.
 * Par défaut de gauche (`centerLeft`) à droite (`centerRight`), comme en Flutter.
 */
export function LinearGradient({
  colors,
  stops,
  begin = Alignment.centerLeft,
  end = Alignment.centerRight,
}: {
  colors: string[];
  stops?: number[];
  begin?: Alignment;
  end?: Alignment;
}): LinearGradient {
  return { type: "linear", colors, stops, begin, end };
}

/** Dégradé circulaire, comme `RadialGradient` en Flutter. */
export interface RadialGradient {
  type: "radial";
  colors: string[];
  stops?: number[];
  center: Alignment;
  /** Rayon, en fraction du plus petit côté de la boîte. Par défaut 0.5. */
  radius: number;
}

export function RadialGradient({
  colors,
  stops,
  center = Alignment.center,
  radius = 0.5,
}: {
  colors: string[];
  stops?: number[];
  center?: Alignment;
  radius?: number;
}): RadialGradient {
  return { type: "radial", colors, stops, center, radius };
}

export type Gradient = LinearGradient | RadialGradient;

function colorStops(colors: string[], stops: number[] | undefined, scale = 1): string {
  return colors.map((color, i) => (stops?.[i] !== undefined ? `${color} ${stops[i]! * scale * 100}%` : color)).join(", ");
}

const SIDE_X: Record<number, string> = { [-1]: "left", 1: "right" };
const SIDE_Y: Record<number, string> = { [-1]: "top", 1: "bottom" };

/** Convertit un dégradé en valeur CSS (`linear-gradient(...)`, `radial-gradient(...)`). */
export function gradientToCss(gradient: Gradient): string {
  if (gradient.type === "radial") {
    // closest-side = un demi plus petit côté (boîte centrée) : radius 0.5 → 100 %.
    return `radial-gradient(circle closest-side at ${alignmentToCssPosition(gradient.center)}, ${colorStops(
      gradient.colors,
      gradient.stops,
      gradient.radius * 2
    )})`;
  }
  const { begin, end } = gradient;
  const stops = colorStops(gradient.colors, gradient.stops);
  // D'un bord ou d'un coin au côté opposé : mots-clés CSS, qui suivent les
  // proportions de la boîte comme en Flutter (coin à coin).
  const opposite = begin.x === -end.x && begin.y === -end.y;
  const onEdges = [end.x, end.y].every((v) => v === -1 || v === 0 || v === 1);
  if (opposite && onEdges && (end.x !== 0 || end.y !== 0)) {
    const to = [SIDE_Y[end.y], SIDE_X[end.x]].filter(Boolean).join(" ");
    return `linear-gradient(to ${to}, ${stops})`;
  }
  // Sinon, l'angle de begin vers end (0deg = vers le haut, sens horaire).
  const angle = (Math.atan2(end.x - begin.x, -(end.y - begin.y)) * 180) / Math.PI;
  return `linear-gradient(${Math.round(angle * 100) / 100}deg, ${stops})`;
}

/** Fabrique façon Flutter : `BoxDecoration({ color: "#eef", borderRadius: BorderRadius.circular(8) })`. */
export function BoxDecoration(decoration: BoxDecoration): BoxDecoration {
  return decoration;
}

export function decorationToCss(decoration: BoxDecoration | undefined): CSSProperties {
  if (!decoration) return {};
  // Calques CSS : le premier est dessiné au-dessus (l'image sur le dégradé).
  const { image, gradient } = decoration;
  const layers = [
    image && { css: `url("${imageSourceUrl(image.image)}")`, ...decorationImageCss(image) },
    gradient && { css: gradientToCss(gradient), size: "auto", position: "0 0", repeat: "no-repeat" },
  ].filter((layer) => !!layer);
  return {
    backgroundColor: decoration.color,
    ...(layers.length > 0 && {
      backgroundImage: layers.map((l) => l.css).join(", "),
      backgroundSize: layers.map((l) => l.size).join(", "),
      backgroundPosition: layers.map((l) => l.position).join(", "),
      backgroundRepeat: layers.map((l) => l.repeat).join(", "),
    }),
    borderRadius: decoration.borderRadius?.toCss(),
    border: decoration.border?.toCss(),
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
