import type { ReactNode } from "react";
import {
  Alignment,
  BorderRadius,
  BoxDecoration,
  Column,
  Container,
  CrossAxisAlignment,
  EdgeInsets,
  Expanded,
  LinearGradient,
  MainAxisAlignment,
  Positioned,
  Row,
  Spacer,
  Stack,
  StatelessWidget,
  Text,
  Theme,
  Wrap,
  type ColorScheme,
} from "../../../../index";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

/** Petite boîte colorée pour visualiser le placement. */
const box = (colors: ColorScheme, label: string, width = 48) =>
  Container({
    width,
    height: 32,
    alignment: Alignment.center,
    decoration: BoxDecoration({ color: colors.primary, borderRadius: BorderRadius.circular(6) }),
    child: Text(label, { style: { color: colors.onPrimary } }),
  });

/** Zone grisée qui contient une démo de placement. */
const area = (colors: ColorScheme, child: ReactNode, height?: number) =>
  Container({
    height,
    padding: EdgeInsets.all(4),
    decoration: BoxDecoration({ color: colors.surfaceContainer, borderRadius: BorderRadius.circular(8) }),
    child,
  });

const caption = (colors: ColorScheme, text: string) =>
  Text(text, { style: { fontSize: 12, color: colors.onSurfaceVariant } });

export class LayoutPage extends StatelessWidget {
  static route = "/layout";
  static metadata = () => ({
    title: "Mise en page",
    description: "Container, Row, Column, alignements, Expanded, Wrap, Stack.",
  });

  override build() {
    const colors = Theme.of().colorScheme;
    const abc = () => [box(colors, "A"), box(colors, "B"), box(colors, "C")];

    return DemoShell({
      current: LayoutPage.route,
      title: "Mise en page",
      description: "Des widgets de placement en CSS flex, avec le vocabulaire de Flutter.",
      children: [
        DemoSection({
          title: "Row — mainAxisAlignment",
          description: "Répartition des enfants sur l'axe horizontal.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: (["start", "center", "end", "spaceBetween", "spaceEvenly"] as MainAxisAlignment[]).map((alignment) =>
              Column({
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 4,
                children: [
                  caption(colors, `MainAxisAlignment.${alignment}`),
                  area(colors, Row({ mainAxisAlignment: alignment, spacing: 4, children: abc() })),
                ],
              })
            ),
          }),
        }),

        DemoSection({
          title: "Column — crossAxisAlignment",
          description: "Placement des enfants sur l'axe perpendiculaire.",
          child: Wrap({
            spacing: 12,
            runSpacing: 12,
            children: (["start", "center", "end", "stretch"] as CrossAxisAlignment[]).map((alignment) =>
              Column({
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 4,
                children: [
                  caption(colors, alignment),
                  Container({
                    width: 140,
                    child: area(
                      colors,
                      Column({
                        crossAxisAlignment: alignment,
                        spacing: 4,
                        children: [box(colors, "A", 40), box(colors, "BB", 70), box(colors, "C", 50)],
                      })
                    ),
                  }),
                ],
              })
            ),
          }),
        }),

        DemoSection({
          title: "Expanded et Spacer",
          description: "Expanded partage l'espace restant selon `flex` ; Spacer pousse les voisins.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              area(
                colors,
                Row({
                  spacing: 4,
                  children: [
                    Expanded({ child: box(colors, "flex 1", Infinity) }),
                    Expanded({ flex: 2, child: box(colors, "flex 2", Infinity) }),
                  ],
                })
              ),
              area(colors, Row({ children: [box(colors, "A"), Spacer(), box(colors, "B")] })),
            ],
          }),
        }),

        DemoSection({
          title: "Wrap",
          description: "Les enfants passent à la ligne quand la place manque (réduisez la fenêtre).",
          child: Wrap({
            spacing: 8,
            runSpacing: 8,
            children: Array.from({ length: 14 }, (_, i) => box(colors, String(i + 1), 64)),
          }),
        }),

        DemoSection({
          title: "Container — décoration",
          description: "Fond, dégradé, coins arrondis, bordure et ombre.",
          child: Wrap({
            spacing: 16,
            runSpacing: 16,
            children: [
              Container({
                width: 120,
                height: 80,
                decoration: BoxDecoration({ color: colors.secondary, borderRadius: BorderRadius.circular(16) }),
              }),
              Container({
                width: 120,
                height: 80,
                decoration: BoxDecoration({
                  gradient: LinearGradient({ colors: ["#6366f1", "#ec4899"], begin: Alignment.topLeft, end: Alignment.bottomRight }),
                  borderRadius: BorderRadius.circular(8),
                }),
              }),
              Container({
                width: 120,
                height: 80,
                decoration: BoxDecoration({
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [{ color: "rgba(0,0,0,0.25)", offset: { dx: 0, dy: 6 }, blurRadius: 16 }],
                }),
              }),
            ],
          }),
        }),

        DemoSection({
          title: "Stack et Positioned",
          description: "Des enfants superposés, placés par rapport aux bords du Stack.",
          child: Stack({
            children: [
              Container({
                height: 140,
                width: Infinity,
                decoration: BoxDecoration({
                  gradient: LinearGradient({ colors: ["#6366f1", "#ec4899"], begin: Alignment.topLeft, end: Alignment.bottomRight }),
                  borderRadius: BorderRadius.circular(12),
                }),
              }),
              Positioned({
                left: 16,
                bottom: 12,
                child: Text("Titre en surimpression", { style: { color: "white", fontSize: 20, fontWeight: 700 } }),
              }),
              Positioned({
                top: 8,
                right: 8,
                child: Container({
                  padding: EdgeInsets.symmetric({ horizontal: 8, vertical: 2 }),
                  decoration: BoxDecoration({ color: colors.surface, borderRadius: BorderRadius.circular(999) }),
                  child: Text("Nouveau", { style: { color: colors.onSurface, fontSize: 12 } }),
                }),
              }),
            ],
          }),
        }),
      ],
    });
  }
}
