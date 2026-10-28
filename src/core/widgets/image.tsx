import { createElement, type CSSProperties, type ReactElement } from "react";
import NextImage from "next/image";
import {
  alignmentToCssPosition,
  imageSourceUrl,
  toCssSize,
  type Alignment,
  type BorderRadius,
  type BoxFit,
  type Dimension,
  type ImageSource,
} from "./painting";

// Images : `Image.asset` (images du projet, optimisées par next/image) et
// `Image.network` (n'importe quelle URL, simple <img> chargée en différé).

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
  return {
    display: "block",
    width: toCssSize(width),
    height: toCssSize(height),
    objectFit: fitToCss[fit],
    objectPosition: alignment && alignmentToCssPosition(alignment),
    borderRadius: borderRadius?.toCss(),
  };
}

/** Taille fixe en px (pas `Infinity`, qui veut dire « toute la place »). */
const isFixed = (value: Dimension | undefined): value is number => value !== undefined && Number.isFinite(value);

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
   * Image du projet, optimisée par Next (redimensionnée, convertie en WebP/AVIF selon l'écran) :
   * ```ts
   * import hero from "./images/hero.jpg";
   * Image.asset(hero, { width: Infinity })
   * ```
   * Importée ainsi, l'image fonctionne aussi sur mobile, et Next connaît sa
   * taille (pas de saut à l'affichage). Un chemin dans `public/`
   * (`"images/hero.jpg"`) marche aussi, mais seulement sur le web.
   *
   * Taille : `width` et `height` en px, ou la taille de l'image importée
   * (réduite proportionnellement si seule `width` ou `height` est donnée).
   * Un chemin `public/` sans taille en px remplit son parent, qui doit donc
   * avoir une taille (Container, SizedBox, Expanded…).
   */
  asset(source: ImageSource, options: AssetImageOptions = {}): ReactElement {
    const { width, height, priority, semanticLabel } = options;
    const alt = semanticLabel ?? "";
    const style = imageStyle(options);
    const sizes = isFixed(width) ? `${width}px` : "100vw";

    if (isFixed(width) && isFixed(height)) {
      return createElement(NextImage, { src: imageSourceOf(source), alt, width, height, priority, style });
    }

    // Image importée : Next connaît ses dimensions, la hauteur suit la largeur.
    if (typeof source === "object") {
      return createElement(NextImage, {
        src: source,
        alt,
        priority,
        sizes,
        placeholder: source.blurDataURL ? "blur" : "empty",
        style: { ...style, width: style.width ?? (height === undefined ? undefined : "auto"), height: style.height ?? "auto" },
      });
    }

    // Chemin public/ sans taille : next/image remplit une boîte positionnée.
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
        src: imageSourceOf(source),
        alt,
        fill: true,
        priority,
        sizes,
        style: { objectFit: style.objectFit, objectPosition: style.objectPosition },
      })
    );
  },
};

/** Source pour next/image : l'objet importé tel quel, sinon l'URL. */
function imageSourceOf(source: ImageSource) {
  return typeof source === "object" ? source : imageSourceUrl(source);
}
