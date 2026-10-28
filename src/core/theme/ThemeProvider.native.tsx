import { useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { colorSchemeFor, darkConfigOf, NativeThemeContext } from "./nativeTheme";
import { textTheme } from "./themeData";
import type { AppThemeConfig, ThemeMode } from "./types";

export interface ThemeProviderProps {
  theme?: AppThemeConfig;
  darkTheme?: AppThemeConfig;
  themeMode?: ThemeMode;
  children: ReactNode;
}

/**
 * Le thème de toute l'app sur mobile. `themeMode` est le mode de départ ;
 * `system` suit le réglage de l'appareil. Le choix fait avec
 * useThemeMode n'est pas encore mémorisé entre deux lancements.
 */
export function ThemeProvider({ theme, darkTheme, themeMode = "system", children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(themeMode);
  const system = useColorScheme();
  const brightness = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;

  const value = useMemo(() => {
    const config = brightness === "dark" ? darkConfigOf(theme, darkTheme) : theme;
    return {
      data: { colorScheme: colorSchemeFor(config, brightness), textTheme, brightness },
      themeMode: mode,
      setThemeMode: setMode,
      config,
    };
  }, [theme, darkTheme, brightness, mode]);

  // React Native Paper (champs, dialogs, menus…) avec les mêmes couleurs.
  const paperTheme = useMemo(() => {
    const base = brightness === "dark" ? MD3DarkTheme : MD3LightTheme;
    const c = value.data.colorScheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.primary,
        onPrimary: c.onPrimary,
        secondary: c.secondary,
        onSecondary: c.onSecondary,
        error: c.error,
        onError: c.onError,
        background: c.background,
        onBackground: c.onBackground,
        surface: c.surface,
        onSurface: c.onSurface,
        onSurfaceVariant: c.onSurfaceVariant,
        outline: c.onSurfaceVariant,
        outlineVariant: c.outline,
      },
    };
  }, [brightness, value]);

  return (
    <NativeThemeContext.Provider value={value}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </NativeThemeContext.Provider>
  );
}
