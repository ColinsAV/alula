"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AsyncSnapshot } from "./async";

// Composant de FutureBuilder (voir async.ts).

const snapshotOf = <T,>(connectionState: AsyncSnapshot<T>["connectionState"], data?: T, error?: unknown): AsyncSnapshot<T> => ({
  connectionState,
  data,
  error,
  hasData: data !== undefined,
  hasError: error !== undefined,
});

export function FutureBuilderView<T>({
  future,
  initialData,
  builder,
}: {
  future: Promise<T> | null | undefined;
  initialData?: T;
  builder: (snapshot: AsyncSnapshot<T>) => ReactNode;
}) {
  const [state, setState] = useState(() => ({
    future,
    snapshot: snapshotOf<T>(future ? "waiting" : "none", initialData),
  }));

  // Marque l'erreur comme gérée dès le rendu : côté serveur, l'effet qui la
  // traite ne s'exécute pas, et Node signalerait une promesse rejetée non gérée.
  future?.catch(() => {});

  // Nouvelle Future : on attend à nouveau, en gardant la dernière donnée (comme Flutter).
  let { snapshot } = state;
  if (state.future !== future) {
    snapshot = snapshotOf<T>(future ? "waiting" : "none", snapshot.data);
    setState({ future, snapshot });
  }

  useEffect(() => {
    if (!future) return;
    // Ignore le résultat si la Future a été remplacée entre-temps.
    let active = true;
    future.then(
      (data) => active && setState({ future, snapshot: snapshotOf<T>("done", data) }),
      (error: unknown) =>
        active && setState((prev) => ({ future, snapshot: snapshotOf<T>("done", prev.snapshot.data, error ?? new Error("Erreur inconnue")) }))
    );
    return () => {
      active = false;
    };
  }, [future]);

  return builder(snapshot);
}
