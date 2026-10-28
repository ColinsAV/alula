import { createElement, type ReactElement } from "react";
import { Icon } from "../widgets/basic.native";
import { IconButton } from "../widgets/material.native";
import { useNativeTheme } from "./nativeTheme";
import type { ThemeMode } from "./types";

export interface ThemeModeHandle {
  themeMode: ThemeMode;
  brightness: "light" | "dark" | undefined;
  setThemeMode: (mode: ThemeMode) => void;
}

/** Lit et change le mode clair / sombre de l'app, depuis `build()`. */
export function useThemeMode(): ThemeModeHandle {
  const { themeMode, setThemeMode, data } = useNativeTheme();
  return { themeMode, setThemeMode, brightness: data.brightness };
}

const NEXT: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };
const ICONS = { light: "light_mode", dark: "dark_mode", system: "brightness_auto" } as const;
const LABELS: Record<ThemeMode, string> = { light: "clair", dark: "sombre", system: "système" };

/** Bouton qui passe de clair à sombre à système. */
export function ThemeModeButton({ color }: { color?: string } = {}): ReactElement {
  return createElement(ThemeModeButtonView, { color });
}

function ThemeModeButtonView({ color }: { color?: string }) {
  const { themeMode, setThemeMode } = useThemeMode();
  return IconButton({
    icon: Icon(ICONS[themeMode]),
    tooltip: `Thème : ${LABELS[themeMode]}`,
    color,
    onPressed: () => setThemeMode(NEXT[themeMode]),
  });
}
