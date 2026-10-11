import { createElement, type CSSProperties, type ReactElement } from "react";
import NextImage from "next/image";
import { toCssSize, type Alignment, type BorderRadius, type Dimension } from "./painting";

// Images : `Image.asset` (fichiers de public/, optimisés par next/image) et
// `Image.network` (n'importe quelle URL, simple <img> chargée en différé).

/** Comment l'image remplit sa boîte, comme `BoxFit` en Flutter. */
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

const fitToCss: Record<BoxFit, CSSProperties["objectFit"]> = {
  contain: "contain",
  cover: "cover",
  fill: "fill",
  none: "none",
  scaleDown: "scale-down",
};

export interface ImageOptions {
  width?: Dimension;
  height?: Dimension;
  /** Par défaut `scaleDown`, comme en Flutter. */
  fit?: BoxFit;
  /** Position de l'image dans sa boîte. Par défaut au centre. */
  alignment?: Alignment;
  /** Texte alternatif (accessibilité, SEO). Absent : image décorative. */
  semanticLabel?: string;
  /** Coins arrondis — raccourci pour `ClipRRect`. */
  borderRadius?: BorderRadius;
}

export interface AssetImageOptions extends ImageOptions {
  /**
   * Image visible dès l'arrivée sur la page (bannière, logo…) : chargée en
   * priorité au lieu d'en différé.
   */
  priority?: boolean;
}

function imageStyle({ width, height, fit = "scaleDown", alignment, borderRadius }: ImageOptions): CSSProperties {
  // Alignment (-1..1) → object-position (0%..100%).
  const percent = (v: number) => `${((v + 1) / 2) * 100}%`;
  return {
    display: "block",
    width: toCssSize(width),
    height: toCssSize(height),
    objectFit: fitToCss[fit],
    objectPosition: alignment && `${percent(alignment.x)} ${percent(alignment.y)}`,
    borderRadius: borderRadius?.toCss(),
  };
}

/** Une image. Voir `Image.asset` et `Image.network`. */
export const Image = {
  /**
   * Image d'une URL quelconque : `Image.network("https://…/photo.jpg", { width: 200 })`.
   * Chargée seulement à l'approche de l'écran.
   */
  network(src: string, options: ImageOptions = {}): ReactElement {
    return createElement("img", {
      src,
      alt: options.semanticLabel ?? "",
      loading: "lazy",
      decoding: "async",
      style: imageStyle(options),
    });
  },

  /**
   * Image du dossier `public/` : `Image.asset("images/hero.jpg", { width: 400, height: 300 })`.
   * Optimisée par Next (redimensionnée, convertie en WebP/AVIF selon l'écran).
   *
   * Avec `width` et `height` en px, l'image a cette taille. Sinon, elle
   * remplit son parent, qui doit donc avoir une taille (Container, SizedBox, Expanded…).
   */
  asset(path: string, options: AssetImageOptions = {}): ReactElement {
    const { width, height, priority, semanticLabel } = options;
    const src = path.startsWith("/") ? path : `/${path}`;
    const alt = semanticLabel ?? "";
    const style = imageStyle(options);

    if (typeof width === "number" && typeof height === "number") {
      return createElement(NextImage, { src, alt, width, height, priority, style });
    }
    // Taille inconnue : next/image remplit une boîte positionnée.
    return createElement(
      "div",
      {
        style: {
          position: "relative",
          width: toCssSize(width) ?? "100%",
          height: toCssSize(height) ?? "100%",
          borderRadius: style.borderRadius,
          overflow: "hidden",
        },
      },
      createElement(NextImage, {
        src,
        alt,
        fill: true,
        priority,
        sizes: typeof width === "number" ? `${width}px` : "100vw",
        style: { objectFit: style.objectFit, objectPosition: style.objectPosition },
      })
    );
  },
};
