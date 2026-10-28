import { createElement, type ReactElement } from "react";
import { Image as ExpoImage } from "expo-image";
import { nativeSize, radiusStyle } from "./nativeStyle";
import type { Alignment, BorderRadius, BoxFit, Dimension, ImageSource } from "./painting";

// Images sur mobile, avec expo-image (cache, formats modernes).

const FIT: Record<BoxFit, "contain" | "cover" | "fill" | "none" | "scale-down"> = {
  contain: "contain",
  cover: "cover",
  fill: "fill",
  none: "none",
  scaleDown: "scale-down",
};

export interface ImageOptions {
  width?: Dimension;
  height?: Dimension;
  fit?: BoxFit;
  alignment?: Alignment;
  semanticLabel?: string;
  borderRadius?: BorderRadius;
}

export interface AssetImageOptions extends ImageOptions {
  /** Web uniquement (chargement prioritaire) ; ignoré sur mobile. */
  priority?: boolean;
}

function image(source: object | number, options: ImageOptions): ReactElement {
  const { width, height, fit = "scaleDown", alignment, semanticLabel, borderRadius } = options;
  return createElement(ExpoImage, {
    source: source as never,
    contentFit: FIT[fit],
    contentPosition: alignment && { left: `${((alignment.x + 1) / 2) * 100}%`, top: `${((alignment.y + 1) / 2) * 100}%` },
    accessibilityLabel: semanticLabel,
    accessible: semanticLabel !== undefined,
    style: { width: nativeSize(width), height: nativeSize(height), ...radiusStyle(borderRadius) },
  });
}

/** Une image. Voir `Image.asset` et `Image.network`. */
export const Image = {
  /** Image d'une URL : `Image.network("https://…/photo.jpg", { width: 200, height: 120 })`. */
  network(src: string, options: ImageOptions = {}): ReactElement {
    return image({ uri: src }, options);
  },

  /**
   * Image du projet : `import hero from "./hero.jpg"; Image.asset(hero, { width: 300, height: 200 })`.
   * Sur mobile, donnez une taille (ou un parent qui en a une) : une image n'a pas de taille par défaut.
   */
  asset(source: ImageSource, options: AssetImageOptions = {}): ReactElement {
    if (typeof source === "string") {
      console.warn(`[better] Image.asset("${source}") : les chemins public/ ne marchent que sur le web. Importez l'image.`);
      return image({ uri: source }, options);
    }
    return image(typeof source === "object" ? { uri: source.src } : source, options);
  },
};
