"use client";

import {
  cloneElement,
  Fragment,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import type { ChangeNotifier, ChangeNotifierProviderProps } from "./changeNotifier";

// Hooks et composants de l'état partagé (voir changeNotifier.ts).

function useSubscribe(notifier: ChangeNotifier) {
  return useCallback(
    (listener: () => void) => {
      notifier.addListener(listener);
      return () => notifier.removeListener(listener);
    },
    [notifier]
  );
}

/** Reconstruit le widget à chaque `notifyListeners()` de `notifier`. */
function useListenable(notifier: ChangeNotifier): void {
  const subscribe = useSubscribe(notifier);
  const version = () => notifier._version;
  useSyncExternalStore(subscribe, version, version);
}

/** Reconstruit seulement quand `selector(notifier)` change (comparé avec `Object.is`). */
function useSelect<N extends ChangeNotifier, R>(notifier: N, selector: (notifier: N) => R): R {
  const subscribe = useSubscribe(notifier);
  const cache = useRef<{ version: number; selector: (notifier: N) => R; value: R } | null>(null);
  // Recalculé seulement si l'objet ou le sélecteur a changé : un sélecteur
  // qui renvoie un nouvel objet à chaque appel ne boucle pas.
  const snapshot = () => {
    const current = cache.current;
    if (current && current.version === notifier._version && current.selector === selector) return current.value;
    const value = selector(notifier);
    cache.current = {
      version: notifier._version,
      selector,
      value: current && Object.is(current.value, value) ? current.value : value,
    };
    return cache.current.value;
  };
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function ListenableBuilderView({ listenable, builder }: { listenable: ChangeNotifier; builder: () => ReactNode }) {
  useListenable(listenable);
  return builder();
}

type NotifierClass<T extends ChangeNotifier> = abstract new (...args: any[]) => T;

/** Les objets fournis au-dessus d'un widget, rangés par classe. */
const ProvidersContext = createContext<ReadonlyMap<Function, ChangeNotifier>>(new Map());

export function ChangeNotifierProviderView<T extends ChangeNotifier>({ create, child }: ChangeNotifierProviderProps<T>) {
  const [notifier] = useState(create);
  const parent = useContext(ProvidersContext);
  const providers = useMemo(
    () => new Map(parent).set(notifier.constructor, notifier),
    [parent, notifier]
  );

  // dispose() différé : en StrictMode (dev), React démonte puis remonte
  // aussitôt ; l'objet ne doit être libéré que s'il n'est pas remonté.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      setTimeout(() => {
        if (!mounted.current) notifier.dispose();
      });
    };
  }, [notifier]);

  return createElement(ProvidersContext.Provider, { value: providers }, child);
}

export function MultiProviderView({ providers, child }: { providers: ReactElement[]; child?: ReactNode }): ReactElement {
  return providers.reduceRight<ReactElement>(
    (inner, provider) => cloneElement(provider, { child: inner } as object),
    createElement(Fragment, null, child)
  );
}

function useProvided<T extends ChangeNotifier>(type: NotifierClass<T>, method: string): T {
  const notifier = useContext(ProvidersContext).get(type);
  if (!notifier) {
    throw new Error(
      `Provider.${method}(${type.name}) : aucun ChangeNotifierProvider de ${type.name} au-dessus de ce widget.`
    );
  }
  return notifier as T;
}

/**
 * Lit, depuis `build()`, un objet fourni par un ChangeNotifierProvider —
 * comme `context.watch` / `context.read` / `context.select` en Flutter.
 */
export const Provider = {
  /** L'objet, et le widget se reconstruit à chaque `notifyListeners()`. */
  watch<T extends ChangeNotifier>(type: NotifierClass<T>): T {
    const notifier = useProvided(type, "watch");
    useListenable(notifier);
    return notifier;
  },

  /**
   * L'objet, sans reconstruire le widget quand il change : pour l'utiliser
   * dans un callback (`onPressed`). À appeler dans `build()`, pas dans le callback.
   */
  read<T extends ChangeNotifier>(type: NotifierClass<T>): T {
    return useProvided(type, "read");
  },

  /**
   * Une valeur tirée de l'objet ; le widget ne se reconstruit que si elle change :
   * `Provider.select(CartModel, (cart) => cart.items.length)`.
   */
  select<T extends ChangeNotifier, R>(type: NotifierClass<T>, selector: (notifier: T) => R): R {
    return useSelect(useProvided(type, "select"), selector);
  },
};
