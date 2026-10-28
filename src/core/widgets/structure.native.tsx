import { createElement, type ReactElement, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMaybeNavigator } from "../navigation/Navigator.native";
import { useNativeTheme } from "../theme/nativeTheme";
import { DefaultTextStyleScope, Icon, Text, textChild } from "./basic.native";
import type { VoidCallback } from "./material.native";
import { insetsStyle, radiusStyle } from "./nativeStyle";
import type { BorderRadius, EdgeInsets } from "./painting";

// Structure d'une page sur mobile : Scaffold, AppBar, Card, ListTile.

// --- Scaffold ---------------------------------------------------------------

export interface ScaffoldProps {
  appBar?: ReactNode;
  body?: ReactNode;
  floatingActionButton?: ReactNode;
  bottomNavigationBar?: ReactNode;
  backgroundColor?: string;
}

/** La structure d'une page : barre du haut, contenu, barre du bas et bouton flottant. */
export function Scaffold(props: ScaffoldProps = {}): ReactElement {
  return createElement(ScaffoldView, props);
}

function ScaffoldView({ appBar, body, floatingActionButton, bottomNavigationBar, backgroundColor }: ScaffoldProps) {
  const colors = useNativeTheme().data.colorScheme;
  const insets = useSafeAreaInsets();
  return createElement(
    View,
    { style: { flex: 1, backgroundColor: backgroundColor ?? colors.background } },
    // Sans AppBar, le contenu ne passe pas sous la barre d'état.
    appBar ?? createElement(View, { style: { height: insets.top } }),
    createElement(View, { style: { flex: 1 } }, textChild(body)),
    bottomNavigationBar ?? createElement(View, { style: { height: insets.bottom } }),
    floatingActionButton &&
      createElement(
        View,
        { style: { position: "absolute", right: 16, bottom: 16 + (bottomNavigationBar ? 64 : insets.bottom) } },
        floatingActionButton
      )
  );
}

// --- AppBar -----------------------------------------------------------------

export interface AppBarProps {
  title?: ReactNode;
  leading?: ReactNode;
  automaticallyImplyLeading?: boolean;
  actions?: ReactNode[];
  centerTitle?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  elevation?: number;
}

/** Barre du haut d'un Scaffold, sous la barre d'état. */
export function AppBar(props: AppBarProps = {}): ReactElement {
  return createElement(AppBarView, props);
}

function AppBarView({
  title,
  leading,
  automaticallyImplyLeading = true,
  actions = [],
  centerTitle = false,
  backgroundColor,
  foregroundColor,
  elevation = 4,
}: AppBarProps) {
  const theme = useNativeTheme();
  const colors = theme.data.colorScheme;
  const appBarTheme = theme.config?.appBarTheme;
  const insets = useSafeAreaInsets();
  const nav = useMaybeNavigator();
  const background = backgroundColor ?? appBarTheme?.backgroundColor ?? colors.primary;
  const foreground = foregroundColor ?? appBarTheme?.foregroundColor ?? colors.onPrimary;

  const leadingWidget =
    leading ??
    (automaticallyImplyLeading && nav?.canPop
      ? createElement(
          Pressable,
          { onPress: nav.pop, accessibilityRole: "button", accessibilityLabel: "Retour", hitSlop: 8, style: { padding: 8 } },
          Icon("arrow_back")
        )
      : null);

  return createElement(
    View,
    {
      style: {
        backgroundColor: background,
        paddingTop: insets.top,
        boxShadow: elevation > 0 ? [{ offsetX: 0, offsetY: elevation / 2, blurRadius: elevation, color: "rgba(0,0,0,0.25)" }] : undefined,
        zIndex: 1,
      },
    },
    createElement(
      DefaultTextStyleScope,
      { style: { color: foreground } },
      createElement(
        View,
        { style: { height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 8 } },
        leadingWidget,
        createElement(
          View,
          { style: { flex: 1, alignItems: centerTitle ? "center" : "flex-start", paddingLeft: leadingWidget ? 0 : 8 } },
          typeof title === "string" ? Text(title, { style: { fontSize: 20, fontWeight: 500 } }) : title
        ),
        ...actions
      )
    )
  );
}

// --- Card -------------------------------------------------------------------

/** Surface surélevée aux coins arrondis. */
export function Card(props: {
  child?: ReactNode;
  elevation?: number;
  margin?: EdgeInsets;
  color?: string;
  borderRadius?: BorderRadius;
}): ReactElement {
  return createElement(CardView, props);
}

function CardView({
  child,
  elevation = 1,
  margin,
  color,
  borderRadius,
}: {
  child?: ReactNode;
  elevation?: number;
  margin?: EdgeInsets;
  color?: string;
  borderRadius?: BorderRadius;
}) {
  const colors = useNativeTheme().data.colorScheme;
  return createElement(
    View,
    {
      style: {
        backgroundColor: color ?? colors.surface,
        borderRadius: 12,
        ...radiusStyle(borderRadius),
        ...insetsStyle(margin, "margin"),
        boxShadow:
          elevation > 0
            ? [{ offsetX: 0, offsetY: elevation, blurRadius: elevation * 3, color: "rgba(0,0,0,0.18)" }]
            : undefined,
      },
    },
    textChild(child)
  );
}

// --- ListTile ---------------------------------------------------------------

export interface ListTileProps {
  leading?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onTap?: VoidCallback;
  selected?: boolean;
  dense?: boolean;
  enabled?: boolean;
}

/** Une ligne de liste : icône, titre, sous-titre, widget à droite. */
export function ListTile(props: ListTileProps): ReactElement {
  return createElement(ListTileView, props);
}

function ListTileView({ leading, title, subtitle, trailing, onTap, selected = false, dense = false, enabled = true }: ListTileProps) {
  const colors = useNativeTheme().data.colorScheme;
  const content = [
    leading && createElement(View, { key: "leading", style: { marginRight: 16 } }, leading),
    createElement(
      View,
      { key: "text", style: { flex: 1 } },
      typeof title === "string"
        ? Text(title, { style: { fontSize: dense ? 14 : 16, color: selected ? colors.primary : undefined } })
        : title,
      typeof subtitle === "string"
        ? Text(subtitle, { style: { fontSize: 14, color: colors.onSurfaceVariant } })
        : subtitle
    ),
    trailing && createElement(View, { key: "trailing", style: { marginLeft: 16 } }, trailing),
  ];
  const style = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: dense ? 4 : 8,
    minHeight: dense ? 48 : 56,
    opacity: enabled ? 1 : 0.5,
    backgroundColor: selected ? colors.surfaceContainer : undefined,
  };
  if (!onTap) return createElement(View, { style }, content);
  return createElement(
    Pressable,
    {
      onPress: onTap,
      disabled: !enabled,
      accessibilityRole: "button",
      style: ({ pressed }: { pressed: boolean }) => [style, pressed && { backgroundColor: colors.surfaceContainer }],
    },
    content
  );
}
