import { createElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { Curves, type Curve } from "./curves";
import { containerStyle, type ContainerProps, type PositionedProps } from "./layout";
import { toCssSize, type Alignment, type EdgeInsets } from "./painting";
import {
  AnimatedSizeView,
  AnimatedSwitcherView,
  TweenAnimationBuilderView,
  type SwitcherTransition,
} from "./animationViews";

// Animations implicites, comme en Flutter : on change une valeur avec
// setState, le widget s'anime tout seul vers la nouvelle valeur.
// Ce sont des transitions CSS : c'est le navigateur qui anime, sans
// reconstruire le widget à chaque image. `data-animated` permet de les
// couper si l'utilisateur a demandé moins d'animations (voir ThemeProvider).

export interface AnimationOptions {
  /** Durée, en ms : `Duration({ milliseconds: 300 })`. */
  duration: number;
  /** Par défaut `Curves.linear`, comme en Flutter. */
  curve?: Curve;
}

const transition = ({ duration, curve = Curves.linear }: AnimationOptions, properties = "all") =>
  properties
    .split(",")
    .map((property) => `${property.trim()} ${duration}ms ${curve.css}`)
    .join(", ");

const animated = (style: CSSProperties, child?: ReactNode): ReactElement =>
  createElement("div", { "data-animated": "", style }, child);

/** Pourcentage CSS d'une coordonnée d'Alignment (-1 → 0 %, 1 → 100 %). */
const percent = (v: number) => `${((v + 1) / 2) * 100}%`;

// --- Boîtes -----------------------------------------------------------------

/**
 * Un Container dont la taille, les couleurs, les marges, la bordure… s'animent :
 * ```ts
 * AnimatedContainer({
 *   duration: Duration({ milliseconds: 300 }),
 *   curve: Curves.easeInOut,
 *   width: this.open ? 300 : 100,
 *   color: this.open ? colors.primary : colors.surfaceContainer,
 * })
 * ```
 */
export function AnimatedContainer({
  duration,
  curve,
  child,
  ...style
}: ContainerProps & AnimationOptions): ReactElement {
  return animated({ ...containerStyle(style), transition: transition({ duration, curve }) }, child);
}

/** Opacité animée. `opacity: 0` : invisible, mais garde sa place. */
export function AnimatedOpacity({
  opacity,
  duration,
  curve,
  child,
}: AnimationOptions & { opacity: number; child?: ReactNode }): ReactElement {
  return animated({ opacity, transition: transition({ duration, curve }, "opacity") }, child);
}

/** Marges intérieures animées. */
export function AnimatedPadding({
  padding,
  duration,
  curve,
  child,
}: AnimationOptions & { padding: EdgeInsets; child?: ReactNode }): ReactElement {
  return animated(
    { boxSizing: "border-box", padding: padding.toCss(), transition: transition({ duration, curve }, "padding") },
    child
  );
}

/** Comme Align, mais l'enfant glisse vers sa nouvelle position. */
export function AnimatedAlign({
  alignment,
  duration,
  curve,
  child,
}: AnimationOptions & { alignment: Alignment; child?: ReactNode }): ReactElement {
  // left/top + translate en % : animable, contrairement à justify-content.
  return createElement(
    "div",
    { style: { position: "relative", width: "100%", height: "100%" } },
    animated(
      {
        position: "absolute",
        left: percent(alignment.x),
        top: percent(alignment.y),
        transform: `translate(-${percent(alignment.x)}, -${percent(alignment.y)})`,
        transition: transition({ duration, curve }, "left, top, transform"),
      },
      child
    )
  );
}

/** Comme Positioned (dans un Stack), mais l'enfant glisse vers sa nouvelle place. */
export function AnimatedPositioned({
  duration,
  curve,
  left,
  top,
  right,
  bottom,
  width,
  height,
  child,
}: PositionedProps & AnimationOptions): ReactElement {
  return animated(
    {
      position: "absolute",
      left,
      top,
      right,
      bottom,
      width: toCssSize(width),
      height: toCssSize(height),
      transition: transition({ duration, curve }),
    },
    child
  );
}

// --- Transformations --------------------------------------------------------

const transformed = (transform: string, options: AnimationOptions, child?: ReactNode) =>
  animated({ width: "fit-content", transform, transition: transition(options, "transform") }, child);

/** Agrandit (> 1) ou rétrécit (< 1) l'enfant, depuis son centre. */
export function AnimatedScale({
  scale,
  duration,
  curve,
  child,
}: AnimationOptions & { scale: number; child?: ReactNode }): ReactElement {
  return transformed(`scale(${scale})`, { duration, curve }, child);
}

/** Fait tourner l'enfant : `turns: 0.5` = un demi-tour. */
export function AnimatedRotation({
  turns,
  duration,
  curve,
  child,
}: AnimationOptions & { turns: number; child?: ReactNode }): ReactElement {
  return transformed(`rotate(${turns}turn)`, { duration, curve }, child);
}

/** Décale l'enfant, en fraction de sa taille : `offset: { dx: 0, dy: 1 }` = une hauteur plus bas. */
export function AnimatedSlide({
  offset,
  duration,
  curve,
  child,
}: AnimationOptions & { offset: { dx: number; dy: number }; child?: ReactNode }): ReactElement {
  return transformed(`translate(${offset.dx * 100}%, ${offset.dy * 100}%)`, { duration, curve }, child);
}

// --- Changement de contenu --------------------------------------------------

/**
 * Anime le remplacement d'un contenu par un autre (l'ancien disparaît
 * pendant que le nouveau apparaît). Le contenu change quand `childKey` change :
 * ```ts
 * AnimatedSwitcher({ duration: 300, childKey: this.count, child: Text(this.count) })
 * ```
 */
export function AnimatedSwitcher({
  duration,
  curve = Curves.linear,
  childKey,
  child,
  transition = "fade",
}: AnimationOptions & {
  /** Identifie le contenu : une nouvelle valeur déclenche l'animation. */
  childKey: string | number;
  child: ReactNode;
  /** `fade` (défaut), `scale` ou `slide` (monte en apparaissant). */
  transition?: SwitcherTransition;
}): ReactElement {
  return createElement(AnimatedSwitcherView, { duration, curve, childKey, child, transition });
}

export const CrossFadeState = { showFirst: "showFirst", showSecond: "showSecond" } as const;
export type CrossFadeState = (typeof CrossFadeState)[keyof typeof CrossFadeState];

/**
 * Fondu entre deux widgets, selon `crossFadeState`. Les deux restent
 * construits, superposés : la boîte a la taille du plus grand.
 */
export function AnimatedCrossFade({
  firstChild,
  secondChild,
  crossFadeState,
  duration,
  curve,
}: AnimationOptions & {
  firstChild: ReactNode;
  secondChild: ReactNode;
  crossFadeState: CrossFadeState;
}): ReactElement {
  const layer = (child: ReactNode, visible: boolean) =>
    createElement(
      "div",
      {
        "data-animated": "",
        "aria-hidden": !visible || undefined,
        style: {
          gridArea: "1 / 1",
          opacity: visible ? 1 : 0,
          // visibility bascule à la fin du fondu : le caché n'est plus cliquable.
          visibility: visible ? "visible" : "hidden",
          transition: transition({ duration, curve }, "opacity, visibility"),
        },
      },
      child
    );
  const first = crossFadeState === "showFirst";
  return createElement("div", { style: { display: "grid" } }, layer(firstChild, first), layer(secondChild, !first));
}

/** Anime la hauteur quand celle du contenu change (texte déplié, liste qui grandit…). */
export function AnimatedSize({
  duration,
  curve = Curves.linear,
  child,
}: AnimationOptions & { child?: ReactNode }): ReactElement {
  return createElement(AnimatedSizeView, { duration, curve, child });
}

// --- Valeur quelconque ------------------------------------------------------

/**
 * Anime un nombre et reconstruit `builder` à chaque image, pour animer ce
 * qu'aucun widget Animated* ne couvre :
 * ```ts
 * TweenAnimationBuilder({
 *   tween: { begin: 0, end: this.score },
 *   duration: 800,
 *   builder: (value) => Text(Math.round(value)),
 * })
 * ```
 * Anime de `begin` à `end` au premier affichage, puis vers chaque nouvel `end`.
 */
export function TweenAnimationBuilder({
  tween,
  duration,
  curve = Curves.linear,
  builder,
  onEnd,
}: AnimationOptions & {
  tween: { begin?: number; end: number };
  builder: (value: number) => ReactNode;
  onEnd?: () => void;
}): ReactElement {
  return createElement(TweenAnimationBuilderView, {
    begin: tween.begin,
    end: tween.end,
    duration,
    curve,
    builder,
    onEnd,
  });
}
