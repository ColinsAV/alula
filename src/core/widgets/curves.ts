// Durées et courbes d'animation, comme `Duration` et `Curves` en Flutter.

/** Une durée en millisecondes : `Duration({ milliseconds: 300 })`, `Duration({ seconds: 1 })`. */
export function Duration({ seconds = 0, milliseconds = 0 }: { seconds?: number; milliseconds?: number }): number {
  return seconds * 1000 + milliseconds;
}

/**
 * Une courbe d'accélération, décrite par des valeurs : `transform` (la
 * fonction) et, si c'est une courbe de Bézier, ses points de contrôle.
 * Chaque plateforme en tire son format : `css` pour le web, et plus tard
 * `Easing.bezier(...)` pour React Native.
 */
export class Curve {
  private _css?: string;

  constructor(
    /** Progression de l'animation (0 → 1) → progression de la valeur. */
    readonly transform: (t: number) => number,
    /** Points de contrôle `(x1, y1, x2, y2)`, si c'est une courbe de Bézier cubique. */
    readonly bezier?: readonly [number, number, number, number],
    css?: string
  ) {
    this._css = css ?? (bezier && `cubic-bezier(${bezier.join(", ")})`);
  }

  /** Valeur CSS (`transition-timing-function`, `easing`). */
  get css(): string {
    // Courbe sans équivalent CSS : échantillonnée avec `linear(...)`.
    this._css ??= `linear(${Array.from({ length: 51 }, (_, i) => +this.transform(i / 50).toFixed(4)).join(", ")})`;
    return this._css;
  }
}

/** Courbe de Bézier cubique, comme `cubic-bezier()` en CSS. */
function cubic(x1: number, y1: number, x2: number, y2: number): Curve {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const transform = (progress: number) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    // Cherche t tel que x(t) = progress : Newton, puis dichotomie si besoin.
    let t = progress;
    for (let i = 0; i < 8; i++) {
      const error = x(t) - progress;
      if (Math.abs(error) < 1e-6) return y(t);
      const slope = dx(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    let low = 0;
    let high = 1;
    t = progress;
    while (high - low > 1e-6) {
      if (x(t) < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return y(t);
  };

  return new Curve(transform, [x1, y1, x2, y2]);
}

function bounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

const ELASTIC_PERIOD = 0.4;

export const Curves = {
  linear: new Curve((t) => t, undefined, "linear"),
  ease: cubic(0.25, 0.1, 0.25, 1),
  easeIn: cubic(0.42, 0, 1, 1),
  easeOut: cubic(0, 0, 0.58, 1),
  easeInOut: cubic(0.42, 0, 0.58, 1),
  /** La courbe standard de Material Design. */
  fastOutSlowIn: cubic(0.4, 0, 0.2, 1),
  decelerate: cubic(0, 0, 0.2, 1),
  /** Recule un peu avant de partir. */
  easeInBack: cubic(0.6, -0.28, 0.735, 0.045),
  /** Dépasse un peu la cible avant d'y revenir. */
  easeOutBack: cubic(0.175, 0.885, 0.32, 1.275),
  easeInOutBack: cubic(0.68, -0.55, 0.265, 1.55),
  /** Rebondit à l'arrivée. */
  bounceOut: new Curve(bounce),
  /** Oscille comme un ressort à l'arrivée. */
  elasticOut: new Curve((t) =>
    t <= 0 || t >= 1
      ? t <= 0 ? 0 : 1
      : Math.pow(2, -10 * t) * Math.sin(((t - ELASTIC_PERIOD / 4) * (Math.PI * 2)) / ELASTIC_PERIOD) + 1
  ),
};
