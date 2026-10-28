import type { ComponentType, CSSProperties } from "react";
import type { IconName } from "./iconNames";

// Icônes par nom, comme `Icons.add` en Flutter, pour un code identique sur
// le web et sur mobile. Sur le web, chaque nom correspond à un composant de
// @mui/icons-material : la CLI `better` repère les `Icons.xxx` utilisés dans
// lib/ et n'enregistre que ceux-là (voir registerIcons), pour ne pas
// embarquer les 10 000 icônes.

export type { IconName };

/**
 * Les noms d'icônes Material : `Icons.add`, `Icons.arrow_back`, `Icons.home_outlined`…
 * Chaque propriété vaut son nom (`Icons.add === "add"`).
 */
export const Icons = new Proxy({} as { readonly [K in IconName]: K }, {
  get: (_, name) => name,
});

/** Composant d'icône du web (SVG MUI). */
export type WebIconComponent = ComponentType<{ style?: CSSProperties }>;

const registry = new Map<string, WebIconComponent>();

/** Enregistre les icônes utilisées par l'app. Appelé par le code généré par la CLI. */
export function registerIcons(icons: Record<string, WebIconComponent>): void {
  for (const [name, component] of Object.entries(icons)) registry.set(name, component);
}

/** Le composant enregistré pour `name`, s'il existe. */
export function registeredIcon(name: string): WebIconComponent | undefined {
  return registry.get(name);
}

/** Nom du fichier MUI d'une icône : `arrow_back` → `ArrowBack`, `grid_3x_3` → `Grid3x3`. */
export function iconComponentName(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
