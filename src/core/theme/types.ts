/**
 * L'équivalent de `ColorScheme.fromSeed(...)` en Flutter : les couleurs
 * nommées par rôle plutôt que par composant, chacune accompagnée de sa
 * couleur "on" (celle du contenu posé dessus — texte, icônes).
 */
export interface AppColorScheme {
  brightness?: "light" | "dark";
  primary?: string;
  onPrimary?: string;
  secondary?: string;
  onSecondary?: string;
  error?: string;
  onError?: string;
  background?: string;
  onBackground?: string;
  surface?: string;
  onSurface?: string;
}

/** L'équivalent de `AppBarTheme`. */
export interface AppBarThemeConfig {
  backgroundColor?: string;
  foregroundColor?: string;
}

/** L'équivalent de `BottomNavigationBarThemeData`. */
export interface BottomNavigationBarThemeConfig {
  backgroundColor?: string;
  selectedItemColor?: string;
  unselectedItemColor?: string;
  /** L'équivalent de `selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold)`. */
  selectedLabelBold?: boolean;
}

/** L'équivalent de `ElevatedButtonThemeData` (via `ElevatedButton.styleFrom`). */
export interface ElevatedButtonThemeConfig {
  backgroundColor?: string;
  foregroundColor?: string;
  /** Rayon des coins, en px — l'équivalent de `BorderRadius.circular(n)`. */
  borderRadius?: number;
}

/**
 * L'équivalent de `ThemeData(...)` passé à `MaterialApp(theme: ...)` : un
 * seul objet qui décrit tout le thème de l'app, au lieu de contextes
 * CSS/styled-components éparpillés.
 */
export interface AppThemeConfig {
  /** Réservé pour un futur bascule M2/M3 — actuellement toujours Material 3 (MUI v6+). */
  useMaterial3?: boolean;
  colorScheme?: AppColorScheme;
  /** Police de toute l'app (valeur CSS `font-family`). */
  fontFamily?: string;
  appBarTheme?: AppBarThemeConfig;
  bottomNavigationBarTheme?: BottomNavigationBarThemeConfig;
  elevatedButtonTheme?: ElevatedButtonThemeConfig;
}

/** Thème utilisé par MaterialApp, comme `ThemeMode` en Flutter. */
export const ThemeMode = {
  /** Suit le réglage clair / sombre de l'appareil (défaut). */
  system: "system",
  light: "light",
  dark: "dark",
} as const;
export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode];
