"use client";

import { createElement, type ReactElement } from "react";
import { useColorScheme } from "@mui/material/styles";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton } from "../widgets/material";
import type { ThemeMode } from "./types";

export interface ThemeModeHandle {
  /** Mode choisi : `light`, `dark` ou `system`. */
  themeMode: ThemeMode;
  /** Thème réellement affiché. `undefined` au premier rendu (inconnu côté serveur). */
  brightness: "light" | "dark" | undefined;
  /** Change le mode et le mémorise dans le navigateur. */
  setThemeMode: (mode: ThemeMode) => void;
}

/**
 * Lit et change le mode clair / sombre de l'app, depuis `build()` :
 * ```ts
 * const { themeMode, setThemeMode } = useThemeMode();
 * ```
 */
export function useThemeMode(): ThemeModeHandle {
  const { mode, systemMode, setMode } = useColorScheme();
  const themeMode = mode ?? "system";
  return {
    themeMode,
    brightness: themeMode === "system" ? systemMode : themeMode,
    setThemeMode: setMode,
  };
}

const NEXT: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };
const ICONS = { light: LightModeIcon, dark: DarkModeIcon, system: BrightnessAutoIcon };
const LABELS: Record<ThemeMode, string> = { light: "clair", dark: "sombre", system: "système" };

/** Bouton qui passe de clair à sombre à système — à mettre dans les `actions` d'une AppBar. */
export function ThemeModeButton({ color }: { color?: string } = {}): ReactElement {
  return createElement(ThemeModeButtonView, { color });
}

function ThemeModeButtonView({ color }: { color?: string }) {
  const { themeMode, setThemeMode } = useThemeMode();
  return IconButton({
    icon: createElement(ICONS[themeMode]),
    tooltip: `Thème : ${LABELS[themeMode]}`,
    color: color ?? "inherit",
    onPressed: () => setThemeMode(NEXT[themeMode]),
  });
}
