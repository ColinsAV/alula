import { createElement, type ReactElement, type ReactNode } from "react";
import { FutureBuilderView } from "./asyncViews";

// Afficher le résultat d'une opération asynchrone (appel API…), comme
// FutureBuilder en Flutter : chargement, erreur, puis donnée.

/** Où en est la Future, comme `ConnectionState` en Flutter. */
export const ConnectionState = {
  /** Pas de Future (`future: null`). */
  none: "none",
  /** En cours. */
  waiting: "waiting",
  /** Terminée, avec une donnée ou une erreur. */
  done: "done",
} as const;
export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

/** L'état de la Future passé à `builder`, comme `AsyncSnapshot` en Flutter. */
export interface AsyncSnapshot<T> {
  connectionState: ConnectionState;
  /** Dernière donnée reçue (gardée pendant le rechargement d'une nouvelle Future). */
  data?: T;
  /** L'erreur, si la Future a échoué. */
  error?: unknown;
  hasData: boolean;
  hasError: boolean;
}

export interface FutureBuilderProps<T> {
  /**
   * La Future (Promise) à attendre. Comme en Flutter, à créer dans
   * `initState` ou dans un callback, jamais dans `build()` : une nouvelle
   * Promise à chaque build relancerait l'appel à chaque fois.
   */
  future: Promise<T> | null | undefined;
  /** Donnée affichée en attendant la première réponse. */
  initialData?: T;
  builder: (snapshot: AsyncSnapshot<T>) => ReactNode;
}

/**
 * Construit l'affichage selon l'état d'une Future :
 * ```ts
 * override initState() {
 *   this.user = fetch("/api/user").then((r) => r.json());
 * }
 *
 * override build() {
 *   return FutureBuilder({
 *     future: this.user,
 *     builder: (snapshot) => {
 *       if (snapshot.hasError) return Text(`Erreur : ${snapshot.error}`);
 *       if (!snapshot.hasData) return CircularProgressIndicator();
 *       return Text(snapshot.data!.name);
 *     },
 *   });
 * }
 * ```
 * Pour recharger : remplacer la Future dans un `setState`.
 */
export function FutureBuilder<T>(props: FutureBuilderProps<T>): ReactElement {
  return createElement(FutureBuilderView<T>, props);
}
