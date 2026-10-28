import type { ReactNode } from "react";
import {
  AppBar,
  BoxConstraints,
  Card,
  Column,
  Container,
  CrossAxisAlignment,
  Divider,
  EdgeInsets,
  ElevatedButton,
  Expanded,
  GridView,
  Icon,
  type IconData,
  Icons,
  ListView,
  NavLink,
  OutlinedButton,
  Padding,
  ResponsiveLayout,
  Row,
  Scaffold,
  StatelessWidget,
  Text,
  TextAlign,
  Theme,
  ThemeModeButton,
  useNavigator,
  Wrap,
} from "../../index";
import { Counter } from "./features/state/Counter";
import { CodeBlock } from "./shell/CodeBlock";
import { SECTIONS } from "./shell/sections";

const FLUTTER_CODE = `class Counter extends StatefulWidget {
  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text('$count'),
      ElevatedButton(
        onPressed: () => setState(() => count++),
        child: Text('+1'),
      ),
    ]);
  }
}`;

const BETTER_CODE = `class Counter extends StatefulWidget {
  private count = 0;

  override build() {
    return Column({
      children: [
        Text(this.count),
        ElevatedButton({
          onPressed: () => this.setState(() => { this.count++; }),
          child: "+1",
        }),
      ],
    });
  }
}`;

const FEATURES: { icon: IconData; title: string; text: string }[] = [
  { icon: Icons.view_quilt, title: "Widgets façon Flutter", text: "Row, Column, Container, Scaffold, Material : le même vocabulaire, en TypeScript." },
  { icon: Icons.search, title: "SEO", text: "Rendu serveur, métadonnées par page, sitemap, robots.txt et vraies 404." },
  { icon: Icons.cloud_download, title: "Données serveur", text: "static load : le contenu arrive dans le HTML, Google le voit." },
  { icon: Icons.alt_route, title: "Navigation", text: "Une pile de pages comme Navigator, synchronisée avec l'URL." },
  { icon: Icons.palette, title: "Thème", text: "Clair, sombre ou système, sans flash au chargement." },
  { icon: Icons.animation, title: "Animations et état", text: "Widgets Animated*, ChangeNotifier et Provider." },
];

const plainLink = { color: "inherit", textDecoration: "none" } as const;

export class HomePage extends StatelessWidget {
  static route = "/";
  static metadata = () => ({
    title: "better — la syntaxe Flutter, le SEO de Next.js",
    description: "Écrivez des widgets façon Flutter, obtenez un vrai site Next.js rendu côté serveur.",
  });

  override build() {
    const theme = Theme.of();
    const colors = theme.colorScheme;
    const nav = useNavigator();

    const heading = (title: string, subtitle?: string) =>
      Column({
        spacing: 8,
        children: [
          Text(title, { style: theme.textTheme.headlineMedium, textAlign: TextAlign.center }),
          subtitle &&
            Text(subtitle, { style: { color: colors.onSurfaceVariant }, textAlign: TextAlign.center }),
        ],
      });

    const hero = Padding({
      padding: EdgeInsets.symmetric({ vertical: 48 }),
      child: Column({
        spacing: 20,
        children: [
          Text("La syntaxe Flutter, le SEO de Next.js", {
            style: { ...theme.textTheme.displaySmall, fontWeight: 700 },
            textAlign: TextAlign.center,
          }),
          Text("Écrivez des widgets, obtenez un vrai site Next rendu côté serveur.", {
            style: { ...theme.textTheme.titleLarge, color: colors.onSurfaceVariant },
            textAlign: TextAlign.center,
          }),
          Wrap({
            spacing: 12,
            runSpacing: 12,
            alignment: "center",
            children: [
              ElevatedButton({ onPressed: () => nav.pushNamed("/layout"), child: "Explorer les widgets" }),
              OutlinedButton({ onPressed: () => nav.pushNamed("/blog"), child: "Voir le blog" }),
            ],
          }),
        ],
      }),
    });

    const flutter = CodeBlock({ label: "Flutter (Dart)", code: FLUTTER_CODE });
    const better = CodeBlock({ label: "better (TypeScript)", code: BETTER_CODE });
    const comparison = Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 24,
      children: [
        heading("Le même widget, des deux côtés", "Si vous connaissez Flutter, vous connaissez déjà better."),
        ResponsiveLayout({
          compact: Column({ crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 16, children: [flutter, better] }),
          expanded: Row({
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 16,
            children: [Expanded({ child: flutter }), Expanded({ child: better })],
          }),
        }),
      ],
    });

    const demo = Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 24,
      children: [
        heading("Essayez", "Ceci est un vrai StatefulWidget, rendu par la lib."),
        Card({ child: Padding({ padding: EdgeInsets.all(24), child: Column({ children: [Counter.new()] }) }) }),
      ],
    });

    const features = Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 24,
      children: [
        heading("Ce qui est inclus"),
        GridView.extent({
          maxCrossAxisExtent: 300,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 1.4,
          shrinkWrap: true,
          children: FEATURES.map((feature) =>
            card(
              Column({
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 8,
                children: [
                  Icon(feature.icon, { size: 28, color: colors.primary }),
                  Text(feature.title, { style: theme.textTheme.titleMedium }),
                  Text(feature.text, { style: { color: colors.onSurfaceVariant } }),
                ],
              })
            )
          ),
        }),
      ],
    });

    const catalogue = Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 24,
      children: [
        heading("Le catalogue", "Chaque section montre les widgets en action."),
        GridView.extent({
          maxCrossAxisExtent: 260,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 1.6,
          shrinkWrap: true,
          children: SECTIONS.map((section) => (
            <NavLink to={section.route as "/"} style={{ ...plainLink, display: "block", height: "100%" }}>
              {card(
                Column({
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: 6,
                  children: [
                    Row({
                      spacing: 8,
                      children: [
                        Icon(section.icon, { size: 22, color: colors.primary }),
                        Text(section.label, { style: theme.textTheme.titleMedium }),
                      ],
                    }),
                    Text(section.description, { style: { fontSize: 14, color: colors.onSurfaceVariant } }),
                  ],
                })
              )}
            </NavLink>
          )),
        }),
      ],
    });

    const footer = Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 16,
      children: [
        Divider(),
        Text("better — licence MIT. Ce site est construit avec better.", {
          style: { fontSize: 13, color: colors.onSurfaceVariant },
          textAlign: TextAlign.center,
        }),
      ],
    });

    return Scaffold({
      appBar: AppBar({
        automaticallyImplyLeading: false,
        title: Text("better", { style: { fontWeight: 700 } }),
        actions: [
          <NavLink to="/layout" style={{ ...plainLink, marginRight: 8 }}>
            Catalogue
          </NavLink>,
          ThemeModeButton(),
        ],
      }),
      body: ListView({
        padding: EdgeInsets.symmetric({ horizontal: 16, vertical: 24 }),
        children: [
          Column({
            children: [
              Container({
                width: Infinity,
                constraints: BoxConstraints({ maxWidth: 1100 }),
                child: Column({
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 72,
                  children: [hero, comparison, demo, features, catalogue, footer],
                }),
              }),
            ],
          }),
        ],
      }),
    });
  }
}

function card(child: ReactNode) {
  return Card({ child: Padding({ padding: EdgeInsets.all(20), child }) });
}
