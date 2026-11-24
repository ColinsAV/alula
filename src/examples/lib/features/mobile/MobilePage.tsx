import {
  Column,
  CrossAxisAlignment,
  Expanded,
  Icon,
  type IconData,
  Icons,
  ListTile,
  ResponsiveLayout,
  Row,
  StatelessWidget,
  Text,
  Theme,
} from "../../../../index";
import { CodeBlock } from "../../shell/CodeBlock";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

const TARGETS: { icon: IconData; title: string; command: string; lines: string[] }[] = [
  {
    icon: Icons.language,
    title: "Web",
    command: "npm run dev",
    lines: [
      "Next.js (App Router), généré dans .alula/",
      "Widgets rendus avec MUI",
      "Rendu serveur, métadonnées, sitemap",
    ],
  },
  {
    icon: Icons.phone_iphone,
    title: "Mobile",
    command: "npm run dev:native",
    lines: [
      "Expo, généré dans .alula-native/",
      "Widgets rendus avec React Native et React Native Paper",
      "Navigation native (React Navigation)",
    ],
  },
];

const DIFFERENCES: { icon: IconData; title: string; text: string }[] = [
  {
    icon: Icons.cloud_download,
    title: "static load s'exécute dans l'app",
    text: "Sur le web, load tourne sur le serveur ; sur mobile, dans l'app. N'y mettez pas de secrets si la page sert aux deux.",
  },
  {
    icon: Icons.image,
    title: "Pas d'images SVG",
    text: "React Native n'affiche pas les .svg : préférez un PNG pour les images partagées.",
  },
  {
    icon: Icons.folder,
    title: "FilePicker",
    text: "Sur mobile, ajoutez expo-document-picker : npx expo install expo-document-picker.",
  },
  {
    icon: Icons.dark_mode,
    title: "Thème",
    text: "Le mode clair / sombre suit le réglage de l'appareil, comme themeMode: ThemeMode.system.",
  },
  {
    icon: Icons.construction,
    title: "Pas encore de build mobile",
    text: "Pour l'instant : Expo Go ou un simulateur. La publication sur les stores (EAS) est prévue.",
  },
];

export class MobilePage extends StatelessWidget {
  static route = "/mobile";
  static metadata = () => ({
    title: "Mobile",
    description: "Le même code alula rendu en React Native : lancer l'app avec Expo, fichiers .native.tsx, différences avec le web.",
  });

  override build() {
    const theme = Theme.of();
    const colors = theme.colorScheme;

    const targets = TARGETS.map((target) =>
      Column({
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 8,
        children: [
          Row({
            spacing: 8,
            children: [
              Icon(target.icon, { size: 24, color: colors.primary }),
              Text(target.title, { style: theme.textTheme.titleMedium }),
            ],
          }),
          ...target.lines.map((line) => Text(`• ${line}`, { style: { color: colors.onSurfaceVariant } })),
          CodeBlock({ code: target.command }),
        ],
      })
    );

    return DemoShell({
      current: MobilePage.route,
      title: "Mobile",
      description:
        "Le même dossier lib/ donne un site Next.js et une app iOS / Android. Chaque widget a une version web et une version React Native : votre code ne change pas.",
      children: [
        DemoSection({
          title: "Un code, deux cibles",
          description: "La CLI alula génère le projet de chaque plateforme à partir de lib/.",
          child: ResponsiveLayout({
            compact: Column({ crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 24, children: targets }),
            expanded: Row({
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 24,
              children: targets.map((child) => Expanded({ child })),
            }),
          }),
        }),

        DemoSection({
          title: "Lancer l'app sur un téléphone",
          description:
            "Installez Expo Go sur le téléphone, puis scannez le QR code affiché dans le terminal. Touche i ou a : simulateur iOS ou Android.",
          child: CodeBlock({
            code: `npx @colinsavenue/alula create mon-app --native
cd mon-app
npm run dev:native`,
          }),
        }),

        DemoSection({
          title: "Essayer ce catalogue sur mobile",
          description: "Toutes les pages de ce site tournent aussi dans l'app, depuis le dépôt de la lib.",
          child: CodeBlock({
            code: `git clone https://github.com/ColinsAV/alula.git
cd alula
npm install
npm run dev:native`,
          }),
        }),

        DemoSection({
          title: "Un fichier propre à une plateforme",
          description:
            "Pour un écran qui doit différer, créez un fichier .native.tsx à côté : Metro le prend sur mobile, Next garde le .tsx. Les deux exportent la même API.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              CodeBlock({
                code: `lib/shell/
  CodeBlock.tsx         // web : <pre> avec défilement horizontal
  CodeBlock.native.tsx  // mobile : ScrollView de React Native`,
              }),
              CodeBlock({
                label: "Partout ailleurs, l'import ne change pas",
                code: `import { CodeBlock } from "./shell/CodeBlock";`,
              }),
            ],
          }),
        }),

        DemoSection({
          title: "Ce qui change sur mobile",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: DIFFERENCES.map((item) =>
              ListTile({
                leading: Icon(item.icon, { color: colors.primary }),
                title: item.title,
                subtitle: item.text,
              })
            ),
          }),
        }),
      ],
    });
  }
}
