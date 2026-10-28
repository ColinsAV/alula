import { createElement, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";
import { textChild } from "./basic.native";
import type { Curve } from "./curves";
import { Align, Container, Padding, Positioned, type ContainerProps, type PositionedProps } from "./layout.native";
import type { Alignment, EdgeInsets } from "./painting";

// Animations sur mobile : phase 3 (Reanimated). En attendant, chaque widget
// affiche directement sa valeur finale, sans transition : les pages
// fonctionnent, elles ne s'animent pas encore.

export interface AnimationOptions {
  duration: number;
  curve?: Curve;
}

export function AnimatedContainer({ duration: _d, curve: _c, ...props }: ContainerProps & AnimationOptions): ReactElement {
  return Container(props);
}

export function AnimatedOpacity({ opacity, child }: AnimationOptions & { opacity: number; child?: ReactNode }): ReactElement {
  return createElement(View, { style: { opacity } }, textChild(child));
}

export function AnimatedPadding({ padding, child }: AnimationOptions & { padding: EdgeInsets; child?: ReactNode }): ReactElement {
  return Padding({ padding, child });
}

export function AnimatedAlign({ alignment, child }: AnimationOptions & { alignment: Alignment; child?: ReactNode }): ReactElement {
  return Align({ alignment, child });
}

export function AnimatedPositioned({ duration: _d, curve: _c, ...props }: PositionedProps & AnimationOptions): ReactElement {
  return Positioned(props);
}

const transformed = (transform: object[], child: ReactNode) =>
  createElement(View, { style: { alignSelf: "flex-start", transform } }, textChild(child));

export function AnimatedScale({ scale, child }: AnimationOptions & { scale: number; child?: ReactNode }): ReactElement {
  return transformed([{ scale }], child);
}

export function AnimatedRotation({ turns, child }: AnimationOptions & { turns: number; child?: ReactNode }): ReactElement {
  return transformed([{ rotate: `${turns * 360}deg` }], child);
}

export function AnimatedSlide({
  offset,
  child,
}: AnimationOptions & { offset: { dx: number; dy: number }; child?: ReactNode }): ReactElement {
  return transformed([{ translateX: `${offset.dx * 100}%` }, { translateY: `${offset.dy * 100}%` }], child);
}

export function AnimatedSwitcher({
  child,
}: AnimationOptions & { childKey: string | number; child: ReactNode; transition?: "fade" | "scale" | "slide" }): ReactElement {
  return createElement(View, null, textChild(child));
}

export const CrossFadeState = { showFirst: "showFirst", showSecond: "showSecond" } as const;
export type CrossFadeState = (typeof CrossFadeState)[keyof typeof CrossFadeState];

export function AnimatedCrossFade({
  firstChild,
  secondChild,
  crossFadeState,
}: AnimationOptions & { firstChild: ReactNode; secondChild: ReactNode; crossFadeState: CrossFadeState }): ReactElement {
  return createElement(View, null, textChild(crossFadeState === "showFirst" ? firstChild : secondChild));
}

export function AnimatedSize({ child }: AnimationOptions & { child?: ReactNode }): ReactElement {
  return createElement(View, null, textChild(child));
}

export function TweenAnimationBuilder({
  tween,
  builder,
}: AnimationOptions & {
  tween: { begin?: number; end: number };
  builder: (value: number) => ReactNode;
  onEnd?: () => void;
}): ReactElement {
  return createElement(View, null, textChild(builder(tween.end)));
}
