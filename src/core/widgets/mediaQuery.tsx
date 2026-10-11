"use client";

import { createElement, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import Box from "@mui/material/Box";

// Taille de l'écran : `MediaQuery.of()` dans `build()`, ou `ResponsiveLayout`
// pour une mise en page juste dès le rendu serveur.

/**
 * Catégories de largeur d'écran Material 3 :
 * `compact` < 600 px (téléphone), `medium` < 840 px (tablette), `expanded` au-delà.
 */
export const WindowSizeClass = { compact: "compact", medium: "medium", expanded: "expanded" } as const;
export type WindowSizeClass = (typeof WindowSizeClass)[keyof typeof WindowSizeClass];

/** Largeurs (px) à partir desquelles commencent `medium` et `expanded`. */
export const Breakpoints = { medium: 600, expanded: 840 } as const;

const sizeClassOf = (width: number): WindowSizeClass =>
  width >= Breakpoints.expanded ? "expanded" : width >= Breakpoints.medium ? "medium" : "compact";

export interface MediaQueryData {
  /** Taille de la fenêtre, en px. */
  size: { width: number; height: number };
  orientation: "portrait" | "landscape";
  windowSizeClass: WindowSizeClass;
  devicePixelRatio: number;
}

function measure(): MediaQueryData {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    size: { width, height },
    orientation: width > height ? "landscape" : "portrait",
    windowSizeClass: sizeClassOf(width),
    devicePixelRatio: window.devicePixelRatio,
  };
}

// Côté serveur, la taille de l'écran est inconnue : on suppose un écran large.
const SERVER: MediaQueryData = {
  size: { width: 1280, height: 800 },
  orientation: "landscape",
  windowSizeClass: "expanded",
  devicePixelRatio: 1,
};

// Une seule mesure partagée : même objet tant que la taille ne change pas.
let current: MediaQueryData | undefined;
const snapshot = () => (current ??= measure());

function subscribe(listener: () => void) {
  const onResize = () => {
    current = measure();
    listener();
  };
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}

export const MediaQuery = {
  /**
   * Infos sur l'écran, depuis `build()` — comme `MediaQuery.of(context)` en Flutter.
   * Le widget se reconstruit quand la fenêtre change de taille.
   *
   * Côté serveur et au premier rendu, la taille est inconnue (écran large
   * supposé) : sur mobile, la page se corrige juste après le chargement.
   * Pour une mise en page juste dès le premier affichage : `ResponsiveLayout`.
   */
  of(): MediaQueryData {
    return useSyncExternalStore(subscribe, snapshot, () => SERVER);
  },

  /** Raccourci pour `MediaQuery.of().size`. */
  sizeOf(): MediaQueryData["size"] {
    return MediaQuery.of().size;
  },
};

/**
 * Un widget différent selon la largeur de l'écran :
 * ```ts
 * ResponsiveLayout({ compact: MobileMenu(), expanded: DesktopMenu() })
 * ```
 * `medium` reprend `compact` s'il est absent, `expanded` reprend `medium`.
 *
 * Choisi en CSS (media queries) : juste dès le rendu serveur, sans saut au
 * chargement. Les variantes sont toutes construites (seule la bonne est
 * visible) : un StatefulWidget présent dans deux variantes y a deux états.
 */
export function ResponsiveLayout({
  compact,
  medium = compact,
  expanded = medium,
}: {
  compact: ReactNode;
  medium?: ReactNode;
  expanded?: ReactNode;
}): ReactElement {
  // Une variante par widget distinct, avec les tailles où elle est visible.
  const variants: { child: ReactNode; on: WindowSizeClass[] }[] = [];
  for (const [sizeClass, child] of [
    ["compact", compact],
    ["medium", medium],
    ["expanded", expanded],
  ] as const) {
    const same = variants.find((v) => v.child === child);
    if (same) same.on.push(sizeClass);
    else variants.push({ child, on: [sizeClass] });
  }

  const display = (visible: boolean) => (visible ? "contents" : "none");
  return createElement(
    "div",
    { style: { display: "contents" } },
    ...variants.map(({ child, on }) =>
      createElement(
        Box,
        {
          sx: {
            display: display(on.includes("compact")),
            [`@media (min-width: ${Breakpoints.medium}px)`]: { display: display(on.includes("medium")) },
            [`@media (min-width: ${Breakpoints.expanded}px)`]: { display: display(on.includes("expanded")) },
          },
        },
        child
      )
    )
  );
}
