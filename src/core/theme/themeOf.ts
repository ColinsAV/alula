"use client";

import { useTheme } from "@mui/material/styles";
import { textTheme, type ThemeData } from "./themeData";
import { useThemeMode } from "./themeMode";

export type { ColorScheme, TextTheme, ThemeData } from "./themeData";

/**
 * Le thème de l'app, depuis `build()` — comme `Theme.of(context)` en Flutter :
 * ```ts
 * const theme = Theme.of();
 * Text("Titre", { style: { ...theme.textTheme.titleLarge, color: theme.colorScheme.primary } })
 * ```
 * Les couleurs sont des variables CSS : elles suivent le mode clair / sombre
 * sans re-rendu, et le HTML rendu côté serveur est déjà juste.
 */
export const Theme = {
  of(): ThemeData {
    const theme = useTheme();
    const { brightness } = useThemeMode();
    const p = (theme.vars ?? theme).palette;
    return {
      colorScheme: {
        primary: p.primary.main,
        onPrimary: p.primary.contrastText,
        secondary: p.secondary.main,
        onSecondary: p.secondary.contrastText,
        error: p.error.main,
        onError: p.error.contrastText,
        background: p.background.default,
        onBackground: p.text.primary,
        surface: p.background.paper,
        onSurface: p.text.primary,
        onSurfaceVariant: p.text.secondary,
        surfaceContainer: p.action.hover,
        outline: p.divider,
      },
      textTheme,
      brightness,
    };
  },
};
