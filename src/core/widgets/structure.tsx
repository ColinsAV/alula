"use client";

import { createElement, type ReactElement, type ReactNode } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MuiAppBar from "@mui/material/AppBar";
import MuiCard from "@mui/material/Card";
import MuiIconButton from "@mui/material/IconButton";
import MuiListItem from "@mui/material/ListItem";
import MuiListItemButton from "@mui/material/ListItemButton";
import MuiListItemText from "@mui/material/ListItemText";
import MuiToolbar from "@mui/material/Toolbar";
import { useMaybeNavigator } from "../navigation/Navigator";
import type { EdgeInsets } from "./painting";
import type { VoidCallback } from "./material";

// --- Scaffold ---------------------------------------------------------------

export interface ScaffoldProps {
  appBar?: ReactNode;
  body?: ReactNode;
  /** Placé en bas à droite, au-dessus du contenu. */
  floatingActionButton?: ReactNode;
  bottomNavigationBar?: ReactNode;
  backgroundColor?: string;
}

/**
 * La structure d'une page : barre du haut, contenu qui défile, barre du bas
 * et bouton flottant. Occupe toute la hauteur de l'écran.
 */
export function Scaffold({
  appBar,
  body,
  floatingActionButton,
  bottomNavigationBar,
  backgroundColor,
}: ScaffoldProps = {}): ReactElement {
  return createElement(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        backgroundColor,
      },
    },
    appBar,
    createElement(
      "main",
      { style: { flex: "1 1 0%", minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" } },
      body
    ),
    bottomNavigationBar,
    floatingActionButton &&
      createElement(
        "div",
        { style: { position: "absolute", right: 16, bottom: bottomNavigationBar ? 72 : 16, zIndex: 10 } },
        floatingActionButton
      )
  );
}

// --- AppBar -----------------------------------------------------------------

export interface AppBarProps {
  title?: ReactNode;
  /** Widget à gauche. Par défaut, un bouton retour si la page peut être dépilée. */
  leading?: ReactNode;
  /** `false` : pas de bouton retour automatique. */
  automaticallyImplyLeading?: boolean;
  /** Widgets à droite (IconButton…). */
  actions?: ReactNode[];
  centerTitle?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  /** Ombre sous la barre. Par défaut 4. */
  elevation?: number;
}

/** Barre du haut d'un Scaffold. */
export function AppBar(props: AppBarProps = {}): ReactElement {
  // Composant à part : il utilise un hook (navigator) pour le bouton retour.
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
  const nav = useMaybeNavigator();
  const leadingWidget =
    leading ??
    (automaticallyImplyLeading && nav?.canPop
      ? createElement(
          MuiIconButton,
          { edge: "start", color: "inherit", "aria-label": "Retour", onClick: nav.pop },
          createElement(ArrowBackIcon)
        )
      : null);

  return createElement(
    MuiAppBar,
    { position: "static", elevation, style: { backgroundColor, color: foregroundColor } },
    createElement(
      MuiToolbar,
      { style: { gap: 8 } },
      leadingWidget,
      createElement(
        "div",
        {
          style: {
            flex: 1,
            fontSize: 20,
            fontWeight: 500,
            textAlign: centerTitle ? "center" : "left",
            overflow: "hidden",
          },
        },
        title
      ),
      ...actions
    )
  );
}

// --- Card -------------------------------------------------------------------

/** Surface surélevée aux coins arrondis. */
export function Card({
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
  /** Rayon des coins, en px. */
  borderRadius?: number;
}): ReactElement {
  return createElement(
    MuiCard,
    { elevation, style: { margin: margin?.toCss(), backgroundColor: color, borderRadius } },
    child
  );
}

// --- ListTile ---------------------------------------------------------------

export interface ListTileProps {
  leading?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** Rend la ligne cliquable. */
  onTap?: VoidCallback;
  selected?: boolean;
  dense?: boolean;
  enabled?: boolean;
}

/** Ligne de liste : icône à gauche, titre, sous-titre, widget à droite. */
export function ListTile({
  leading,
  title,
  subtitle,
  trailing,
  onTap,
  selected = false,
  dense = false,
  enabled = true,
}: ListTileProps): ReactElement {
  const content = [
    leading && createElement("div", { key: "leading", style: { display: "flex", marginRight: 16 } }, leading),
    createElement(MuiListItemText, { key: "text", primary: title, secondary: subtitle }),
    trailing && createElement("div", { key: "trailing", style: { display: "flex", marginLeft: 16 } }, trailing),
  ];

  return onTap
    ? createElement(MuiListItemButton, { onClick: onTap, selected, dense, disabled: !enabled }, ...content)
    : createElement(MuiListItem, { dense, style: { opacity: enabled ? 1 : 0.5 } }, ...content);
}
