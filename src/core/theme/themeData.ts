import { FontWeight, type TextStyle } from "../widgets/painting";

// Types et échelle de texte du thème, communs au web et au mobile (voir themeOf).

/** Couleurs du thème, nommées comme le `ColorScheme` de Flutter. */
export interface ColorScheme {
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  error: string;
  onError: string;
  /** Fond de la page. */
  background: string;
  onBackground: string;
  /** Fond des cartes, dialogs, menus… */
  surface: string;
  onSurface: string;
  /** Texte secondaire, moins contrasté. */
  onSurfaceVariant: string;
  /** Fond légèrement teinté, pour démarquer une zone (encart, liste…). */
  surfaceContainer: string;
  /** Bordures et séparateurs. */
  outline: string;
}

/** Styles de texte Material 3, comme le `TextTheme` de Flutter. */
export interface TextTheme {
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  displaySmall: TextStyle;
  headlineLarge: TextStyle;
  headlineMedium: TextStyle;
  headlineSmall: TextStyle;
  titleLarge: TextStyle;
  titleMedium: TextStyle;
  titleSmall: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  labelLarge: TextStyle;
  labelMedium: TextStyle;
  labelSmall: TextStyle;
}

export interface ThemeData {
  colorScheme: ColorScheme;
  textTheme: TextTheme;
  /** Thème affiché. `undefined` au premier rendu (inconnu côté serveur). */
  brightness: "light" | "dark" | undefined;
}

const size = (fontSize: number, height: number, fontWeight: number = FontWeight.w400): TextStyle => ({
  fontSize,
  height: height / fontSize,
  fontWeight,
});

// Échelle typographique Material 3 (taille / hauteur de ligne en px).
export const textTheme: TextTheme = {
  displayLarge: size(57, 64),
  displayMedium: size(45, 52),
  displaySmall: size(36, 44),
  headlineLarge: size(32, 40),
  headlineMedium: size(28, 36),
  headlineSmall: size(24, 32),
  titleLarge: size(22, 28),
  titleMedium: size(16, 24, FontWeight.w500),
  titleSmall: size(14, 20, FontWeight.w500),
  bodyLarge: size(16, 24),
  bodyMedium: size(14, 20),
  bodySmall: size(12, 16),
  labelLarge: size(14, 20, FontWeight.w500),
  labelMedium: size(12, 16, FontWeight.w500),
  labelSmall: size(11, 16, FontWeight.w500),
};
