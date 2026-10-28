import { createElement, useState, type ReactElement, type ReactNode } from "react";
import { Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNativeTheme } from "../theme/nativeTheme";
import { DefaultTextStyleScope, Text } from "./basic.native";
import { MediaQuery } from "./mediaQuery.native";
import type * as Web from "./navigation";
import { Scaffold } from "./structure.native";
import type { WindowSizeClass } from "./windowSize";

// Barres d'onglets sur mobile : TabBar (en haut), BottomNavigationBar (en
// bas), NavigationRail (sur le côté), et TabScaffold qui les assemble.
// Même API que navigation.tsx (web).

export type NavigationItem = Web.NavigationItem;
export type TabBarProps = Web.TabBarProps;
export type BottomNavigationBarProps = Web.BottomNavigationBarProps;
export type NavigationRailProps = Web.NavigationRailProps;
export type TabItem = Web.TabItem;
export type TabScaffoldProps = Web.TabScaffoldProps;

export const Tab = (item: NavigationItem): NavigationItem => item;
export const BottomNavigationBarItem = (item: NavigationItem): NavigationItem => item;
export const NavigationRailDestination = (item: NavigationItem): NavigationItem => item;
export const TabItem = (item: TabItem): TabItem => item;

export const TabPosition = { top: "top", bottom: "bottom", left: "left", right: "right" } as const;
export type TabPosition = (typeof TabPosition)[keyof typeof TabPosition];

const iconOf = (item: NavigationItem, selected: boolean) => (selected && item.activeIcon) || item.icon;

/** Un onglet : icône (dans une pastille quand il est sélectionné) et libellé. */
function Destination({
  item,
  selected,
  onPress,
  compact,
}: {
  item: NavigationItem;
  selected: boolean;
  onPress: () => void;
  /** Libellé sous l'icône (barre du bas, rail) plutôt qu'à côté (TabBar). */
  compact: boolean;
}) {
  const colors = useNativeTheme().data.colorScheme;
  const color = selected ? colors.primary : colors.onSurfaceVariant;
  const icon = iconOf(item, selected);
  return createElement(
    Pressable,
    {
      onPress,
      accessibilityRole: "tab",
      accessibilityState: { selected },
      style: ({ pressed }: { pressed: boolean }): ViewStyle => ({
        flex: compact ? 1 : undefined,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: compact ? "column" : "row",
        gap: compact ? 4 : 8,
        paddingVertical: compact ? 10 : 12,
        paddingHorizontal: 16,
        opacity: pressed ? 0.7 : 1,
      }),
    },
    createElement(
      DefaultTextStyleScope,
      { style: { color } },
      icon &&
        createElement(
          View,
          {
            style: compact
              ? {
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                  borderRadius: 16,
                  backgroundColor: selected ? colors.surfaceContainer : undefined,
                }
              : undefined,
          },
          icon
        ),
      Text(item.label, { style: { fontSize: compact ? 12 : 14, fontWeight: selected ? 600 : 500 } })
    )
  );
}

// --- TabBar -----------------------------------------------------------------

/** Rangée d'onglets, généralement sous l'AppBar. */
export function TabBar(props: TabBarProps): ReactElement {
  return createElement(TabBarView, props);
}

function TabBarView({ tabs, currentIndex, onTap, isScrollable = false }: TabBarProps) {
  const colors = useNativeTheme().data.colorScheme;
  const items = tabs.map((tab, index) =>
    createElement(
      View,
      {
        key: index,
        style: {
          flex: isScrollable ? undefined : 1,
          // Indicateur sous l'onglet sélectionné.
          borderBottomWidth: 3,
          borderBottomColor: index === currentIndex ? colors.primary : "transparent",
        },
      },
      createElement(Destination, { item: tab, selected: index === currentIndex, onPress: () => onTap(index), compact: false })
    )
  );
  const style = { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.outline };
  return isScrollable
    ? createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { ...style, flexGrow: 0 } }, ...items)
    : createElement(View, { style: { ...style, flexDirection: "row" } }, ...items);
}

// --- BottomNavigationBar ----------------------------------------------------

/** Barre d'onglets en bas de l'écran. À mettre dans `Scaffold.bottomNavigationBar`. */
export function BottomNavigationBar(props: BottomNavigationBarProps): ReactElement {
  return createElement(BottomNavigationBarView, props);
}

function BottomNavigationBarView({ items, currentIndex, onTap }: BottomNavigationBarProps) {
  const colors = useNativeTheme().data.colorScheme;
  const insets = useSafeAreaInsets();
  return createElement(
    View,
    {
      style: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.outline,
        paddingBottom: insets.bottom,
      },
    },
    ...items.map((item, index) =>
      createElement(Destination, { key: index, item, selected: index === currentIndex, onPress: () => onTap(index), compact: true })
    )
  );
}

// --- NavigationRail ---------------------------------------------------------

/** Colonne d'onglets sur le côté de l'écran, pour tablette. */
export function NavigationRail(props: NavigationRailProps): ReactElement {
  return createElement(NavigationRailView, props);
}

function NavigationRailView({ destinations, selectedIndex, onDestinationSelected, side = "left" }: NavigationRailProps) {
  const colors = useNativeTheme().data.colorScheme;
  return createElement(
    ScrollView,
    {
      style: {
        flexGrow: 0,
        width: 88,
        backgroundColor: colors.surface,
        [side === "left" ? "borderRightWidth" : "borderLeftWidth"]: 1,
        borderColor: colors.outline,
      },
      contentContainerStyle: { paddingVertical: 8, gap: 4 },
    },
    ...destinations.map((item, index) =>
      createElement(Destination, {
        key: index,
        item,
        selected: index === selectedIndex,
        onPress: () => onDestinationSelected(index),
        compact: true,
      })
    )
  );
}

// --- IndexedStack -----------------------------------------------------------

/** N'affiche que l'enfant `index`, mais garde les autres montés (cachés). */
export function IndexedStack({ index, children = [] }: { index: number; children?: ReactNode[] }): ReactElement {
  return createElement(
    View,
    { style: { flex: 1 } },
    ...children.map((child, i) => createElement(View, { style: { flex: 1, display: i === index ? "flex" : "none" } }, child))
  );
}

// --- TabScaffold ------------------------------------------------------------

/** Une page à onglets complète : AppBar, barre d'onglets à la position voulue et contenu. */
export function TabScaffold(props: TabScaffoldProps): ReactElement {
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

  const position = resolvePosition(positionProp, MediaQuery.of().windowSizeClass);
  const insets = useSafeAreaInsets();
  const select = (i: number) => {
    setOwnIndex(i);
    onTap?.(i);
  };

  const bodies = createElement(
    View,
    { style: { flex: 1 } },
    ...tabs.map((tab, i) =>
      createElement(View, { key: i, style: { flex: 1, display: i === index ? "flex" : "none" } }, opened.has(i) ? tab.body : null)
    )
  );

  // Même arbre quelle que soit la position : les onglets gardent leur état.
  const side = position === "left" || position === "right";
  const body = createElement(
    View,
    { style: { flex: 1, flexDirection: position === "right" ? "row-reverse" : "row" } },
    side ? NavigationRail({ destinations: tabs, selectedIndex: index, onDestinationSelected: select, side: position }) : null,
    bodies
  );

  return Scaffold({
    appBar:
      position === "top"
        ? // Sans AppBar, la TabBar ne doit pas passer sous la barre d'état.
          createElement(View, { style: { paddingTop: appBar ? 0 : insets.top } }, appBar, TabBar({ tabs, currentIndex: index, onTap: select }))
        : appBar,
    floatingActionButton,
    body,
    bottomNavigationBar:
      position === "bottom" ? BottomNavigationBar({ items: tabs, currentIndex: index, onTap: select }) : undefined,
  });
}
