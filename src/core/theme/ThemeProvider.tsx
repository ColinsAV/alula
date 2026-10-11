"use client";

import { useMemo, type ReactNode } from "react";
import { createTheme, CssBaseline, GlobalStyles, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { buildMuiTheme } from "./buildMuiTheme";
import type { AppThemeConfig, ThemeMode } from "./types";

// Moins d'animations demandé dans les réglages du système : les widgets
// Animated* (marqués data-animated) changent sans transition.
const REDUCED_MOTION = {
  "@media (prefers-reduced-motion: reduce)": {
    "[data-animated]": { transitionDuration: "0s !important" },
  },
};

export interface ThemeProviderProps {
  theme?: AppThemeConfig;
  darkTheme?: AppThemeConfig;
  themeMode?: ThemeMode;
  children: ReactNode;
}

/**
 * Le thème de toute l'app, posé par MaterialApp. Sous le capot, un thème MUI
 * (donc valable pour tous les composants MUI, pas seulement ceux de cette lib)
 * et `CssBaseline` — le reset CSS qu'applique implicitement `MaterialApp`.
 */
export function ThemeProvider({ theme, darkTheme, themeMode, children }: ThemeProviderProps) {
  const muiTheme = useMemo(() => createTheme(buildMuiTheme(theme, darkTheme)), [theme, darkTheme]);

  // `themeMode` : mode par défaut, tant que l'utilisateur n'en a pas choisi
  // un (useThemeMode / ThemeModeButton, mémorisé dans le navigateur).
  return (
    <MuiThemeProvider theme={muiTheme} defaultMode={themeMode ?? "system"}>
      <CssBaseline enableColorScheme />
      <GlobalStyles styles={REDUCED_MOTION} />
      {children}
    </MuiThemeProvider>
  );
}
