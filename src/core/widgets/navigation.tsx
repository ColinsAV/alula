"use client";

import { createElement, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import MuiBottomNavigation from "@mui/material/BottomNavigation";
import MuiBottomNavigationAction from "@mui/material/BottomNavigationAction";
import MuiTab from "@mui/material/Tab";
import MuiTabs from "@mui/material/Tabs";
import { MediaQuery, type WindowSizeClass } from "./mediaQuery";
import { Scaffold } from "./structure";

// Barres de navigation entre onglets : TabBar (en haut), BottomNavigationBar
// (en bas), NavigationRail (sur le côté), et TabScaffold qui les assemble.

/** Un onglet : libellé, icône, et icône quand il est sélectionné. */
export interface NavigationItem {
  label: string;
  icon?: ReactNode;
  /** Icône quand l'onglet est sélectionné. Par défaut `icon`. */
  activeIcon?: ReactNode;
}

/** Onglet d'une TabBar. */
export const Tab = (item: NavigationItem): NavigationItem => item;
/** Onglet d'une BottomNavigationBar. */
export const BottomNavigationBarItem = (item: NavigationItem): NavigationItem => item;
/** Onglet d'un NavigationRail. */
export const NavigationRailDestination = (item: NavigationItem): NavigationItem => item;

// MUI n'accepte qu'un élément comme icône d'onglet (Icon(...) en est un).
const iconOf = (item: NavigationItem, selected: boolean) =>
  ((selected && item.activeIcon) || item.icon || undefined) as ReactElement | undefined;

// --- TabBar -----------------------------------------------------------------

export interface TabBarProps {
  tabs: NavigationItem[];
  currentIndex: number;
  onTap: (index: number) => void;
  /** `true` : onglets à leur taille, défilants s'ils dépassent. Sinon, ils se partagent la largeur. */
  isScrollable?: boolean;
}

/** Rangée d'onglets, généralement sous l'AppBar. */
export function TabBar({ tabs, currentIndex, onTap, isScrollable = false }: TabBarProps): ReactElement {
  return createElement(
    MuiTabs,
    {
      value: currentIndex,
      onChange: (_event: unknown, index: number) => onTap(index),
      variant: isScrollable ? "scrollable" : "fullWidth",
      scrollButtons: isScrollable ? "auto" : false,
      sx: { borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", flexShrink: 0 },
    },
    ...tabs.map((tab, index) =>
      createElement(MuiTab, {
        label: tab.label,
        icon: iconOf(tab, index === currentIndex),
        iconPosition: "start",
        sx: { minHeight: 48 },
      })
    )
  );
}

// --- BottomNavigationBar ----------------------------------------------------

export interface BottomNavigationBarProps {
  items: NavigationItem[];
  currentIndex: number;
  onTap: (index: number) => void;
}

/** Barre d'onglets en bas de l'écran, pour mobile. À mettre dans `Scaffold.bottomNavigationBar`. */
export function BottomNavigationBar({ items, currentIndex, onTap }: BottomNavigationBarProps): ReactElement {
  return createElement(
    MuiBottomNavigation,
    {
      value: currentIndex,
      onChange: (_event: unknown, index: number) => onTap(index),
      showLabels: true,
      sx: { borderTop: 1, borderColor: "divider", flexShrink: 0 },
    },
    ...items.map((item, index) =>
      createElement(MuiBottomNavigationAction, {
        label: item.label,
        icon: iconOf(item, index === currentIndex),
      })
    )
  );
}

// --- NavigationRail ---------------------------------------------------------

export interface NavigationRailProps {
  destinations: NavigationItem[];
  selectedIndex: number;
  onDestinationSelected: (index: number) => void;
  /** Côté de l'écran, pour placer l'indicateur et la bordure. Par défaut `left`. */
  side?: "left" | "right";
}

/** Colonne d'onglets sur le côté de l'écran, pour tablette et desktop. */
export function NavigationRail({
  destinations,
  selectedIndex,
  onDestinationSelected,
  side = "left",
}: NavigationRailProps): ReactElement {
  const border = side === "left" ? "borderRight" : "borderLeft";
  return createElement(
    MuiTabs,
    {
      value: selectedIndex,
      onChange: (_event: unknown, index: number) => onDestinationSelected(index),
      orientation: "vertical",
      variant: "scrollable",
      sx: {
        [border]: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
        minWidth: 88,
        // L'indicateur, côté contenu.
        ...(side === "right" && { "& .MuiTabs-indicator": { left: 0, right: "auto" } }),
      },
    },
    ...destinations.map((destination, index) =>
      createElement(MuiTab, {
        label: destination.label,
        icon: iconOf(destination, index === selectedIndex),
        sx: { minWidth: 88, px: 1, fontSize: 12, textTransform: "none" },
      })
    )
  );
}

// --- IndexedStack -----------------------------------------------------------

/**
 * N'affiche que l'enfant `index`, mais garde les autres montés (cachés) :
 * leur état survit quand on revient dessus.
 */
export function IndexedStack({ index, children = [] }: { index: number; children?: ReactNode[] }): ReactElement {
  return createElement(
    "div",
    { style: { display: "contents" } },
    ...children.map((child, i) => createElement("div", { style: { display: i === index ? "contents" : "none" } }, child))
  );
}

// --- TabScaffold ------------------------------------------------------------

/** Où placer la barre d'onglets d'un TabScaffold. */
export const TabPosition = { top: "top", bottom: "bottom", left: "left", right: "right" } as const;
export type TabPosition = (typeof TabPosition)[keyof typeof TabPosition];

/** Un onglet de TabScaffold : son entrée dans la barre et son contenu. */
export interface TabItem extends NavigationItem {
  body: ReactNode;
}

export const TabItem = (item: TabItem): TabItem => item;

export interface TabScaffoldProps {
  tabs: TabItem[];
  /**
   * Position de la barre, fixe (`TabPosition.bottom`) ou selon la largeur de
   * l'écran : `{ compact: "bottom", expanded: "left" }`. Par défaut `top`.
   * Côtés : NavigationRail ; haut : TabBar ; bas : BottomNavigationBar.
   */
  position?: TabPosition | Partial<Record<WindowSizeClass, TabPosition>>;
  appBar?: ReactNode;
  floatingActionButton?: ReactNode;
  /** Onglet affiché au départ. Par défaut 0. */
  initialIndex?: number;
  /** Onglet affiché, si vous gérez l'état vous-même (avec `onTap`). */
  currentIndex?: number;
  onTap?: (index: number) => void;
}

/**
 * Une page à onglets complète : AppBar, barre d'onglets à la position voulue
 * et contenu de l'onglet sélectionné.
 * ```ts
 * TabScaffold({
 *   position: { compact: TabPosition.bottom, expanded: TabPosition.left },
 *   tabs: [
 *     TabItem({ label: "Accueil", icon: Icon(HomeIcon), body: HomeTab.new() }),
 *     TabItem({ label: "Profil", icon: Icon(PersonIcon), body: ProfileTab.new() }),
 *   ],
 * })
 * ```
 * Un onglet est construit à sa première ouverture, puis gardé : son état
 * (formulaire, scroll…) survit quand on change d'onglet.
 */
export function TabScaffold(props: TabScaffoldProps): ReactElement {
  // Composant à part : il garde l'onglet sélectionné et lit la taille de l'écran.
  return createElement(TabScaffoldView, props);
}

function resolvePosition(position: TabScaffoldProps["position"], sizeClass: WindowSizeClass): TabPosition {
  if (typeof position === "string") return position;
  const compact = position?.compact ?? "top";
  const medium = position?.medium ?? compact;
  const expanded = position?.expanded ?? medium;
  return { compact, medium, expanded }[sizeClass];
}

function TabScaffoldView({
  tabs,
  position: positionProp,
  appBar,
  floatingActionButton,
  initialIndex = 0,
  currentIndex: controlledIndex,
  onTap,
}: TabScaffoldProps) {
  const [ownIndex, setOwnIndex] = useState(initialIndex);
  const index = controlledIndex ?? ownIndex;
  // Onglets déjà ouverts : construits une fois, puis gardés.
  const [opened, setOpened] = useState(() => new Set([index]));
  if (!opened.has(index)) setOpened(new Set(opened).add(index));

  const { windowSizeClass } = MediaQuery.of();
  const position = resolvePosition(positionProp, windowSizeClass);

  const select = (i: number) => {
    setOwnIndex(i);
    onTap?.(i);
  };

  const pane: CSSProperties = { flex: "1 1 0%", minWidth: 0, minHeight: 0, overflowY: "auto", flexDirection: "column" };
  const bodies = createElement(
    "div",
    { style: { flex: "1 1 0%", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" } },
    ...tabs.map((tab, i) =>
      createElement("div", { style: { ...pane, display: i === index ? "flex" : "none" } }, opened.has(i) ? tab.body : null)
    )
  );

  // Même arbre quelle que soit la position (le rail est juste absent) : en
  // changeant de position (redimensionnement), les onglets gardent leur état.
  const side = position === "left" || position === "right";
  const body = createElement(
    "div",
    {
      style: {
        flex: "1 1 0%",
        minHeight: 0,
        display: "flex",
        flexDirection: position === "right" ? "row-reverse" : "row",
      },
    },
    side
      ? NavigationRail({ destinations: tabs, selectedIndex: index, onDestinationSelected: select, side: position })
      : null,
    bodies
  );

  return Scaffold({
    appBar:
      position === "top"
        ? createElement("div", { style: { display: "contents" } }, appBar, TabBar({ tabs, currentIndex: index, onTap: select }))
        : appBar,
    floatingActionButton,
    body,
    bottomNavigationBar:
      position === "bottom" ? BottomNavigationBar({ items: tabs, currentIndex: index, onTap: select }) : undefined,
  });
}
