import { createElement, type ReactElement, type ReactNode } from "react";
import { PixelRatio, useWindowDimensions } from "react-native";
import { sizeClassOf, type MediaQueryData } from "./windowSize";

export { Breakpoints, WindowSizeClass, type MediaQueryData } from "./windowSize";

// Taille de l'écran sur mobile : pas de rendu serveur, la taille est connue
// dès le premier affichage.

export const MediaQuery = {
  /** Infos sur l'écran, depuis `build()` — comme `MediaQuery.of(context)` en Flutter. */
  of(): MediaQueryData {
    const { width, height } = useWindowDimensions();
    return {
      size: { width, height },
      orientation: width > height ? "landscape" : "portrait",
      windowSizeClass: sizeClassOf(width),
      devicePixelRatio: PixelRatio.get(),
    };
  },

  /** Raccourci pour `MediaQuery.of().size`. */
  sizeOf(): MediaQueryData["size"] {
    return MediaQuery.of().size;
  },
};

/** Un widget différent selon la largeur de l'écran. Sur mobile, seule la bonne variante est construite. */
export function ResponsiveLayout(props: { compact: ReactNode; medium?: ReactNode; expanded?: ReactNode }): ReactElement {
  return createElement(ResponsiveLayoutView, props);
}

function ResponsiveLayoutView({ compact, medium = compact, expanded = medium }: { compact: ReactNode; medium?: ReactNode; expanded?: ReactNode }) {
  const { windowSizeClass } = MediaQuery.of();
  return ({ compact, medium, expanded }[windowSizeClass] ?? null) as ReactElement | null;
}
