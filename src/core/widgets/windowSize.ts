// Tailles d'écran, communes au web et au mobile (voir mediaQuery).

/**
 * Catégories de largeur d'écran Material 3 :
 * `compact` < 600 px (téléphone), `medium` < 840 px (tablette), `expanded` au-delà.
 */
export const WindowSizeClass = { compact: "compact", medium: "medium", expanded: "expanded" } as const;
export type WindowSizeClass = (typeof WindowSizeClass)[keyof typeof WindowSizeClass];

/** Largeurs (px) à partir desquelles commencent `medium` et `expanded`. */
export const Breakpoints = { medium: 600, expanded: 840 } as const;

export const sizeClassOf = (width: number): WindowSizeClass =>
  width >= Breakpoints.expanded ? "expanded" : width >= Breakpoints.medium ? "medium" : "compact";

export interface MediaQueryData {
  /** Taille de la fenêtre, en px. */
  size: { width: number; height: number };
  orientation: "portrait" | "landscape";
  windowSizeClass: WindowSizeClass;
  devicePixelRatio: number;
}
