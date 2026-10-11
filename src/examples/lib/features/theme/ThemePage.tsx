import {
  Border,
  BorderRadius,
  BoxDecoration,
  Column,
  Container,
  CrossAxisAlignment,
  EdgeInsets,
  ElevatedButton,
  MediaQuery,
  ResponsiveLayout,
  StatelessWidget,
  Text,
  Theme,
  ThemeMode,
  ThemeModeButton,
  useThemeMode,
  Wrap,
  type ColorScheme,
  type TextTheme,
} from "../../../../index";
import { CodeBlock } from "../../shell/CodeBlock";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

/** Couleurs affichées : fond / couleur du texte posé dessus. */
const SWATCHES: [keyof ColorScheme, keyof ColorScheme | null][] = [
  ["primary", "onPrimary"],
  ["secondary", "onSecondary"],
  ["error", "onError"],
  ["background", "onBackground"],
  ["surface", "onSurface"],
  ["surfaceContainer", "onSurface"],
  ["outline", null],
];

const TEXT_STYLES: (keyof TextTheme)[] = [
  "displaySmall",
  "headlineMedium",
  "titleLarge",
  "titleMedium",
  "bodyLarge",
  "bodyMedium",
  "labelSmall",
];

const MODE_LABELS = { light: "Clair", dark: "Sombre", system: "Système" } as const;

export class ThemePage extends StatelessWidget {
  static route = "/theme";
  static metadata = () => ({
    title: "Thème",
    description: "Theme.of : couleurs et textes du thème, mode clair / sombre, MediaQuery et ResponsiveLayout.",
  });

  override build() {
    const theme = Theme.of();
    const colors = theme.colorScheme;
    const { themeMode, brightness, setThemeMode } = useThemeMode();
    const media = MediaQuery.of();

    return DemoShell({
      current: ThemePage.route,
      title: "Thème",
      description: "Les couleurs du thème sont des variables CSS : elles suivent le mode sans reconstruire les widgets.",
      children: [
        DemoSection({
          title: "Mode clair / sombre",
          description: `Mode choisi : ${MODE_LABELS[themeMode]}${brightness ? ` — affiché : ${MODE_LABELS[brightness]}` : ""}. Le choix est mémorisé.`,
          child: Wrap({
            spacing: 8,
            runSpacing: 8,
            children: [
              ...(Object.values(ThemeMode) as ThemeMode[]).map((mode) =>
                ElevatedButton({ onPressed: mode === themeMode ? null : () => setThemeMode(mode), child: MODE_LABELS[mode] })
              ),
              ThemeModeButton(),
            ],
          }),
        }),

        DemoSection({
          title: "Theme.of().colorScheme",
          child: Wrap({
            spacing: 12,
            runSpacing: 12,
            children: SWATCHES.map(([background, foreground]) =>
              Container({
                width: 150,
                height: 72,
                padding: EdgeInsets.all(10),
                decoration: BoxDecoration({
                  color: colors[background],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all({ color: colors.outline }),
                }),
                child: Text(background, { style: { fontSize: 13, color: foreground ? colors[foreground] : colors.onSurface } }),
              })
            ),
          }),
        }),

        DemoSection({
          title: "Theme.of().textTheme",
          description: "L'échelle de texte Material 3.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 8,
            children: TEXT_STYLES.map((name) => Text(name, { style: theme.textTheme[name] })),
          }),
        }),

        DemoSection({
          title: "MediaQuery et ResponsiveLayout",
          description: "Redimensionnez la fenêtre.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Text(`MediaQuery : ${media.size.width} × ${media.size.height} px, ${media.windowSizeClass}, ${media.orientation}`),
              ResponsiveLayout({
                compact: Text("ResponsiveLayout : téléphone 📱", { style: { color: colors.primary } }),
                medium: Text("ResponsiveLayout : tablette", { style: { color: colors.primary } }),
                expanded: Text("ResponsiveLayout : écran large 🖥️", { style: { color: colors.primary } }),
              }),
              CodeBlock({
                code: `const colors = Theme.of().colorScheme;
Text("Titre", { style: { ...Theme.of().textTheme.titleLarge, color: colors.primary } })`,
              }),
            ],
          }),
        }),
      ],
    });
  }
}
