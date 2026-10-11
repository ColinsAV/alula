"use client";

import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import type { Curve } from "./curves";

// Composants des widgets animés qui ont besoin d'un état (voir animation.tsx).

/** L'utilisateur a demandé moins d'animations dans les réglages de son système. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// --- AnimatedSwitcher -------------------------------------------------------

export type SwitcherTransition = "fade" | "scale" | "slide";

const FRAMES: Record<SwitcherTransition, Keyframe[]> = {
  fade: [{ opacity: 0 }, { opacity: 1 }],
  scale: [{ opacity: 0, transform: "scale(0.8)" }, { opacity: 1, transform: "scale(1)" }],
  slide: [{ opacity: 0, transform: "translateY(25%)" }, { opacity: 1, transform: "translateY(0)" }],
};

export interface AnimatedSwitcherViewProps {
  childKey: string | number;
  child: ReactNode;
  duration: number;
  curve: Curve;
  transition: SwitcherTransition;
}

export function AnimatedSwitcherView({ childKey, child, duration, curve, transition }: AnimatedSwitcherViewProps) {
  // Clés affichées : la courante, plus celles qui disparaissent.
  const [items, setItems] = useState<{ key: string | number; leaving: boolean; initial: boolean }[]>(() => [
    { key: childKey, leaving: false, initial: true },
  ]);
  // Dernier contenu de chaque clé : un enfant qui part garde son dernier affichage.
  const children = useRef(new Map<string | number, ReactNode>());
  children.current.set(childKey, child);

  const current = items.find((item) => !item.leaving);
  if (current?.key !== childKey) {
    setItems([
      ...items.filter((item) => item.key !== childKey).map((item) => ({ ...item, leaving: true })),
      { key: childKey, leaving: false, initial: false },
    ]);
  }

  const remove = (key: string | number) => {
    setItems((prev) => prev.filter((item) => item.key !== key || !item.leaving));
    if (key !== childKey) children.current.delete(key);
  };

  return createElement(
    "div",
    { style: { display: "grid" } },
    ...items.map((item) =>
      createElement(
        SwitcherItem,
        {
          key: String(item.key),
          leaving: item.leaving,
          initial: item.initial,
          frames: FRAMES[transition],
          options: { duration, easing: curve.css },
          onRemoved: () => remove(item.key),
        },
        children.current.get(item.key)
      )
    )
  );
}

function SwitcherItem({
  leaving,
  initial,
  frames,
  options,
  onRemoved,
  children,
}: {
  leaving: boolean;
  initial: boolean;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  onRemoved: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onRemovedRef = useRef(onRemoved);
  onRemovedRef.current = onRemoved;

  // Entrée (sauf le tout premier enfant, comme en Flutter).
  useEffect(() => {
    if (initial || prefersReducedMotion() || !ref.current?.animate) return;
    const animation = ref.current.animate(frames, options);
    return () => animation.cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sortie, puis retrait.
  useEffect(() => {
    if (!leaving) return;
    if (prefersReducedMotion() || !ref.current?.animate) {
      onRemovedRef.current();
      return;
    }
    const animation = ref.current.animate([...frames].reverse(), { ...options, fill: "forwards" });
    animation.onfinish = () => onRemovedRef.current();
    return () => animation.cancel();
  }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps

  return createElement(
    "div",
    {
      ref,
      "aria-hidden": leaving || undefined,
      style: { gridArea: "1 / 1", pointerEvents: leaving ? "none" : undefined },
    },
    children
  );
}

// --- AnimatedSize -----------------------------------------------------------

export function AnimatedSizeView({ duration, curve, child }: { duration: number; curve: Curve; child: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  // Hauteur mesurée : `auto` tant qu'elle est inconnue (rendu serveur).
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const element = inner.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return createElement(
    "div",
    {
      "data-animated": "",
      style: {
        height: height ?? "auto",
        overflow: "hidden",
        transition: `height ${duration}ms ${curve.css}`,
      },
    },
    createElement("div", { ref: inner }, child)
  );
}

// --- TweenAnimationBuilder --------------------------------------------------

export interface TweenAnimationBuilderViewProps {
  begin?: number;
  end: number;
  duration: number;
  curve: Curve;
  builder: (value: number) => ReactNode;
  onEnd?: () => void;
}

export function TweenAnimationBuilderView({
  begin,
  end,
  duration,
  curve,
  builder,
  onEnd,
}: TweenAnimationBuilderViewProps) {
  const [value, setValue] = useState(begin ?? end);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  // Anime de la valeur actuelle vers `end` à chaque changement de `end`.
  useEffect(() => {
    const from = valueRef.current;
    if (from === end) return;
    if (prefersReducedMotion() || duration <= 0) {
      setValue(end);
      onEndRef.current?.();
      return;
    }
    let start: number | undefined;
    let frame = requestAnimationFrame(function step(now) {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      setValue(from + (end - from) * curve.transform(t));
      if (t < 1) frame = requestAnimationFrame(step);
      else onEndRef.current?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [end, duration, curve]);

  return builder(value);
}
