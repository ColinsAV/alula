import type { CSSObject, Theme, ThemeOptions } from "@mui/material/styles";
import type { AppThemeConfig } from "./types";

type Brightness = "light" | "dark";

/** Retire les clés `undefined` : MUI calcule alors ses valeurs par défaut. */
const defined = <T extends object>(object: T) =>
  Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined)) as T;

const color = (main?: string, contrastText?: string) =>
  main ? defined({ main, contrastText }) : undefined;

function palette(config: AppThemeConfig | undefined, mode: Brightness) {
  const scheme = config?.colorScheme ?? {};
  const background = scheme.background ?? scheme.surface;
  const paper = scheme.surface ?? scheme.background;
  return defined({
    mode,
    primary: color(scheme.primary, scheme.onPrimary),
    secondary: color(scheme.secondary, scheme.onSecondary),
    error: color(scheme.error, scheme.onError),
    background: background ? { default: background, paper } : undefined,
    text: scheme.onSurface || scheme.onBackground
      ? { primary: scheme.onSurface ?? scheme.onBackground }
      : undefined,
  });
}

/** Styles par composant MUI et par slot, tirés des `*Theme` de la config. */
type Overrides = Record<string, Record<string, CSSObject>>;

function overrides(config: AppThemeConfig | undefined): Overrides {
  const { appBarTheme, bottomNavigationBarTheme: nav, elevatedButtonTheme: button } = config ?? {};
  const result: Overrides = {};
  if (appBarTheme) {
    result.MuiAppBar = {
      root: defined({ backgroundColor: appBarTheme.backgroundColor, color: appBarTheme.foregroundColor }),
    };
  }
  if (nav) {
    result.MuiBottomNavigation = { root: defined({ backgroundColor: nav.backgroundColor }) };
    result.MuiBottomNavigationAction = {
      root: {
        ...defined({ color: nav.unselectedItemColor }),
        "&.Mui-selected": defined({ color: nav.selectedItemColor }),
      },
      label: { "&.Mui-selected": defined({ fontWeight: nav.selectedLabelBold ? 700 : undefined }) },
    };
  }
  if (button) {
    result.MuiButton = {
      root: {
        "&.MuiButton-containedPrimary": defined({
          backgroundColor: button.backgroundColor,
          color: button.foregroundColor,
          borderRadius: button.borderRadius,
        }),
      },
    };
  }
  return result;
}

/**
 * Fusionne les styles du thème clair et du thème sombre : ceux du sombre
 * passent dans `theme.applyStyles("dark", …)`, appliqué quand `<html>`
 * porte la classe `dark`.
 */
function mergeOverrides(light: Overrides, dark: Overrides): ThemeOptions["components"] {
  const components: Record<string, { styleOverrides: Record<string, unknown> }> = {};
  for (const name of new Set([...Object.keys(light), ...Object.keys(dark)])) {
    const slots = new Set([...Object.keys(light[name] ?? {}), ...Object.keys(dark[name] ?? {})]);
    const styleOverrides: Record<string, unknown> = {};
    for (const slot of slots) {
      const lightStyle = light[name]?.[slot] ?? {};
      const darkStyle = dark[name]?.[slot];
      styleOverrides[slot] = darkStyle
        ? ({ theme }: { theme: Theme }) => ({ ...lightStyle, ...theme.applyStyles("dark", darkStyle) })
        : lightStyle;
    }
    components[name] = { styleOverrides };
  }
  return components as ThemeOptions["components"];
}

/**
 * Traduit les props `theme` / `darkTheme` de MaterialApp (le vocabulaire
 * Flutter : `ColorScheme`, `AppBarTheme`…) en options de thème MUI.
 *
 * Les deux palettes sont toujours définies, en variables CSS : le mode
 * (clair, sombre, système) se choisit par une classe sur `<html>`, sans
 * reconstruire le thème. Sans `darkTheme`, le sombre reprend les couleurs
 * principales de `theme` sur le fond sombre par défaut de MUI.
 */
export function buildMuiTheme(theme?: AppThemeConfig, darkTheme?: AppThemeConfig): ThemeOptions {
  const fontFamily = (theme ?? darkTheme)?.fontFamily;
  const { primary, onPrimary, secondary, onSecondary, error, onError } = theme?.colorScheme ?? {};
  const dark = darkTheme ?? {
    colorScheme: { primary, onPrimary, secondary, onSecondary, error, onError },
  };

  return {
    cssVariables: { colorSchemeSelector: "class" },
    colorSchemes: {
      light: { palette: palette(theme, "light") },
      dark: { palette: palette(dark, "dark") },
    },
    ...(fontFamily && { typography: { fontFamily } }),
    components: mergeOverrides(overrides(theme), overrides(darkTheme)),
  };
}
