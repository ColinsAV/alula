import type { ReactNode } from "react";
import {
  Alignment,
  AnimatedAlign,
  AnimatedContainer,
  AnimatedCrossFade,
  AnimatedOpacity,
  AnimatedRotation,
  AnimatedScale,
  AnimatedSize,
  AnimatedSwitcher,
  BorderRadius,
  BoxDecoration,
  Column,
  Container,
  CrossAxisAlignment,
  CrossFadeState,
  Curves,
  Duration,
  EdgeInsets,
  ElevatedButton,
  Icon,
  IconButton,
  Icons,
  Padding,
  Row,
  SizedBox,
  StatefulWidget,
  Text,
  Theme,
  TweenAnimationBuilder,
  Wrap,
} from "../../../../index";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

const ALIGNMENTS = [Alignment.topLeft, Alignment.topRight, Alignment.bottomRight, Alignment.bottomLeft];
const fast = Duration({ milliseconds: 300 });
const slow = Duration({ milliseconds: 800 });

export class AnimationsPage extends StatefulWidget {
  static route = "/animations";
  static metadata = () => ({
    title: "Animations",
    description: "AnimatedContainer, AnimatedSwitcher, AnimatedCrossFade, TweenAnimationBuilder…",
  });

  private expanded = false;
  private visible = true;
  private liked = false;
  private turns = 0;
  private corner = 0;
  private count = 0;
  private showDetails = false;
  private score = 0;

  override initState() {}

  private section(title: string, demo: ReactNode, action: ReactNode) {
    return DemoSection({ title, child: Row({ spacing: 16, children: [action, demo] }) });
  }

  override build() {
    const theme = Theme.of();
    const colors = theme.colorScheme;

    return DemoShell({
      current: AnimationsPage.route,
      title: "Animations",
      description: "Animations implicites : changez une valeur avec setState, le widget s'anime vers elle.",
      children: [
              this.section(
                "AnimatedContainer — taille, couleur, coins (Curves.easeInOut)",
                AnimatedContainer({
                  duration: fast,
                  curve: Curves.easeInOut,
                  width: this.expanded ? 240 : 80,
                  height: 80,
                  decoration: BoxDecoration({
                    color: this.expanded ? colors.primary : colors.secondary,
                    borderRadius: BorderRadius.circular(this.expanded ? 40 : 8),
                  }),
                }),
                ElevatedButton({
                  onPressed: () => this.setState(() => { this.expanded = !this.expanded; }),
                  child: this.expanded ? "Réduire" : "Agrandir",
                })
              ),

              this.section(
                "AnimatedOpacity",
                AnimatedOpacity({ opacity: this.visible ? 1 : 0, duration: fast, child: Text("Coucou 👋") }),
                ElevatedButton({
                  onPressed: () => this.setState(() => { this.visible = !this.visible; }),
                  child: this.visible ? "Cacher" : "Montrer",
                })
              ),

              this.section(
                "AnimatedScale (Curves.elasticOut) + AnimatedRotation",
                Row({
                  spacing: 24,
                  children: [
                    AnimatedScale({
                      scale: this.liked ? 1.6 : 1,
                      duration: slow,
                      curve: Curves.elasticOut,
                      child: Icon(Icons.favorite, { color: this.liked ? "#e11d48" : colors.onSurfaceVariant }),
                    }),
                    AnimatedRotation({
                      turns: this.turns,
                      duration: slow,
                      curve: Curves.easeOutBack,
                      child: Icon(Icons.refresh, { size: 32 }),
                    }),
                  ],
                }),
                Row({
                  spacing: 8,
                  children: [
                    ElevatedButton({
                      onPressed: () => this.setState(() => { this.liked = !this.liked; }),
                      child: "J'aime",
                    }),
                    ElevatedButton({
                      onPressed: () => this.setState(() => { this.turns += 0.5; }),
                      child: "Tourner",
                    }),
                  ],
                })
              ),

              this.section(
                "AnimatedAlign (Curves.fastOutSlowIn)",
                SizedBox({
                  width: 200,
                  height: 120,
                  child: Container({
                    height: Infinity,
                    decoration: BoxDecoration({ color: colors.surfaceContainer, borderRadius: BorderRadius.circular(8) }),
                    child: AnimatedAlign({
                      alignment: ALIGNMENTS[this.corner]!,
                      duration: slow,
                      curve: Curves.fastOutSlowIn,
                      child: Container({
                        width: 32,
                        height: 32,
                        margin: EdgeInsets.all(8),
                        decoration: BoxDecoration({ color: colors.primary, borderRadius: BorderRadius.circular(16) }),
                      }),
                    }),
                  }),
                }),
                ElevatedButton({
                  onPressed: () => this.setState(() => { this.corner = (this.corner + 1) % ALIGNMENTS.length; }),
                  child: "Coin suivant",
                })
              ),

              this.section(
                "AnimatedSwitcher (transition: slide)",
                AnimatedSwitcher({
                  duration: fast,
                  curve: Curves.easeOut,
                  transition: "slide",
                  childKey: this.count,
                  child: Text(this.count, { style: { ...theme.textTheme.displaySmall, color: colors.primary } }),
                }),
                Wrap({
                  spacing: 8,
                  children: [
                    IconButton({
                      icon: Text("−", { style: { fontSize: 24 } }),
                      tooltip: "Retirer 1",
                      onPressed: () => this.setState(() => { this.count--; }),
                    }),
                    IconButton({
                      icon: Text("+", { style: { fontSize: 24 } }),
                      tooltip: "Ajouter 1",
                      onPressed: () => this.setState(() => { this.count++; }),
                    }),
                  ],
                })
              ),

              this.section(
                "AnimatedCrossFade + AnimatedSize",
                Container({
                  width: 280,
                  child: Column({
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: 8,
                    children: [
                      AnimatedCrossFade({
                        duration: fast,
                        crossFadeState: this.showDetails ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                        firstChild: Text("Résumé court."),
                        secondChild: Text("Résumé détaillé !", { style: { color: colors.primary } }),
                      }),
                      AnimatedSize({
                        duration: fast,
                        curve: Curves.easeInOut,
                        child: this.showDetails
                          ? Padding({
                              padding: EdgeInsets.symmetric({ vertical: 8 }),
                              child: Text(
                                "Ce paragraphe apparaît en dépliant la boîte : AnimatedSize anime la hauteur quand le contenu change.",
                                { style: { color: colors.onSurfaceVariant } }
                              ),
                            })
                          : null,
                      }),
                    ],
                  }),
                }),
                ElevatedButton({
                  onPressed: () => this.setState(() => { this.showDetails = !this.showDetails; }),
                  child: this.showDetails ? "Replier" : "Déplier",
                })
              ),

              this.section(
                "TweenAnimationBuilder — un nombre qui défile",
                TweenAnimationBuilder({
                  tween: { begin: 0, end: this.score },
                  duration: slow,
                  curve: Curves.easeOut,
                  builder: (value) =>
                    Text(`${Math.round(value)} pts`, { style: { ...theme.textTheme.headlineMedium } }),
                }),
                ElevatedButton({
                  onPressed: () => this.setState(() => { this.score += Math.round(100 + Math.random() * 900); }),
                  child: "Marquer des points",
                })
              ),
      ],
    });
  }
}
