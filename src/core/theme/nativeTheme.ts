import { createContext, useContext } from "react";
import { textTheme, type ColorScheme, type ThemeData } from "./themeData";
import type { AppThemeConfig, ThemeMode } from "./types";

// Thème sur mobile (React Native) : pas de variables CSS, les couleurs sont
// calculées pour le mode affiché et passées par un contexte React.
// Mêmes couleurs par défaut que MUI sur le web.

const LIGHT: ColorScheme = {
  primary: "#1976d2",
  onPrimary: "#ffffff",
  secondary: "#9c27b0",
  onSecondary: "#ffffff",
  error: "#d32f2f",
  onError: "#ffffff",
  background: "#ffffff",
  onBackground: "rgba(0, 0, 0, 0.87)",
  surface: "#ffffff",
  onSurface: "rgba(0, 0, 0, 0.87)",
  onSurfaceVariant: "rgba(0, 0, 0, 0.6)",
  surfaceContainer: "rgba(0, 0, 0, 0.04)",
  outline: "rgba(0, 0, 0, 0.12)",
};

const DARK: ColorScheme = {
  primary: "#90caf9",
  onPrimary: "rgba(0, 0, 0, 0.87)",
  secondary: "#ce93d8",
  onSecondary: "rgba(0, 0, 0, 0.87)",
  error: "#f44336",
  onError: "#ffffff",
  background: "#121212",
  onBackground: "#ffffff",
  surface: "#1e1e1e",
  onSurface: "#ffffff",
  onSurfaceVariant: "rgba(255, 255, 255, 0.7)",
  surfaceContainer: "rgba(255, 255, 255, 0.08)",
  outline: "rgba(255, 255, 255, 0.12)",
};

/** Couleur du texte lisible sur `color` (noir ou blanc), pour les couleurs hexadécimales. */
function contrastText(color: string, fallback: string): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) return fallback;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return luminance > 0.5 ? "rgba(0, 0, 0, 0.87)" : "#ffffff";
}

/** Les couleurs d'un thème de MaterialApp pour un mode donné. */
export function colorSchemeFor(config: AppThemeConfig | undefined, brightness: "light" | "dark"): ColorScheme {
  const base = brightness === "dark" ? DARK : LIGHT;
  const scheme = config?.colorScheme ?? {};
  const pick = (value: string | undefined, fallback: string) => value ?? fallback;
  const primary = pick(scheme.primary, base.primary);
  const secondary = pick(scheme.secondary, base.secondary);
  const error = pick(scheme.error, base.error);
  const background = pick(scheme.background ?? scheme.surface, base.background);
  const surface = pick(scheme.surface ?? scheme.background, base.surface);
  return {
    ...base,
    primary,
    onPrimary: scheme.onPrimary ?? contrastText(primary, base.onPrimary),
    secondary,
    onSecondary: scheme.onSecondary ?? contrastText(secondary, base.onSecondary),
    error,
    onError: scheme.onError ?? contrastText(error, base.onError),
    background,
    onBackground: scheme.onBackground ?? scheme.onSurface ?? base.onBackground,
    surface,
    onSurface: scheme.onSurface ?? scheme.onBackground ?? base.onSurface,
  };
}

/** Comme sur le web : sans darkTheme, le sombre reprend les couleurs principales de `theme`. */
export function darkConfigOf(theme?: AppThemeConfig, darkTheme?: AppThemeConfig): AppThemeConfig | undefined {
  if (darkTheme) return darkTheme;
  const { primary, onPrimary, secondary, onSecondary, error, onError } = theme?.colorScheme ?? {};
  return { colorScheme: { primary, onPrimary, secondary, onSecondary, error, onError } };
}

export interface NativeThemeValue {
  data: ThemeData;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  /** Config d'origine : styles des composants (AppBar…). */
  config?: AppThemeConfig;
}

export const NativeThemeContext = createContext<NativeThemeValue>({
  data: { colorScheme: LIGHT, textTheme, brightness: "light" },
  themeMode: "system",
  setThemeMode: () => {},
});

/** Le thème courant (couleurs réelles du mode affiché). */
export function useNativeTheme(): NativeThemeValue {
  return useContext(NativeThemeContext);
}
