"use client";

import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import MuiLinearProgress from "@mui/material/LinearProgress";
import type { NavigatorHandle, NavigatorProviderProps } from "./types";
import {
  buildPath,
  loadRouteMetadata,
  preloadRoute,
  resolveMetadata,
  resolveRoute,
  routeDataFetcher,
  type LoadResult,
  type Routes,
} from "./routes";
import { renderWidget, type PageClass, type WidgetClass } from "./pageRoutes";

interface StackEntry {
  id: number;
  element: ReactElement;
  /** Titre de l'onglet tant que cette page est au-dessus (métadonnées de sa route). */
  title?: string;
}

const HISTORY_DEPTH_KEY = "__widgetsNavDepth";
const HISTORY_PATH_KEY = "__widgetsNavPath";

/** Durée de vie des données préchargées au survol d'un lien (ms). */
const DATA_CACHE_TTL = 30_000;

const NavigatorContext = createContext<NavigatorHandle | null>(null);

/**
 * Le conteneur de navigation : maintient une pile de pages en mémoire,
 * comme le `Navigator` de Flutter. Toutes les pages de la pile restent
 * montées (juste cachées via `hidden`) — pas seulement la page du dessus —
 * pour que leur état (un compteur, un scroll, un formulaire en cours...)
 * survive quand on navigue dessus puis qu'on revient en arrière.
 */
export function NavigatorProvider(props: NavigatorProviderProps) {
  const { syncWithBrowserHistory = true, routes, onUnknownRoute } = props;

  const idCounter = useRef(0);
  const nextId = () => ++idCounter.current;

  const routesRef = useRef<Routes | undefined>(routes);
  routesRef.current = routes;
  const onUnknownRouteRef = useRef(onUnknownRoute);
  onUnknownRouteRef.current = onUnknownRoute;

  const unknownPage = useCallback(
    (path: string): ReactElement => onUnknownRouteRef.current?.(path) ?? <p>Page introuvable : {path}</p>,
    []
  );

  const pageForPath = useCallback(
    (path: string, data?: unknown): ReactElement =>
      (routesRef.current ? resolveRoute(routesRef.current, path, data) : null) ?? unknownPage(path),
    [unknownPage]
  );

  const titleForPath = useCallback(
    (path: string, data?: unknown) =>
      routesRef.current ? resolveMetadata(routesRef.current, path, data)?.title : undefined,
    []
  );

  // --- données des pages (`static load`) ---

  // Chargement en cours (barre en haut de l'écran) ; le compteur ignore les
  // réponses d'une navigation remplacée par une plus récente.
  const [loading, setLoading] = useState(false);
  const navigationId = useRef(0);
  const dataCache = useRef(new Map<string, { promise: Promise<LoadResult>; time: number }>());

  /** Données de `path` : préchargées récemment, sinon demandées au serveur. */
  const dataFor = useCallback((path: string, fetchData: (path: string) => Promise<LoadResult>) => {
    const cached = dataCache.current.get(path);
    if (cached && Date.now() - cached.time < DATA_CACHE_TTL) return cached.promise;
    const promise = fetchData(path);
    dataCache.current.set(path, { promise, time: Date.now() });
    promise.catch(() => dataCache.current.delete(path));
    return promise;
  }, []);

  /**
   * Charge les données de `path` si sa page en a, puis appelle `then(found, data)`.
   * En cas d'erreur, recharge entièrement la page : le serveur l'affichera.
   */
  const withData = useCallback(
    (path: string, then: (found: boolean, data?: unknown) => void) => {
      const fetchData = routesRef.current ? routeDataFetcher(routesRef.current, path) : undefined;
      if (!fetchData) return then(true);

      const id = ++navigationId.current;
      setLoading(true);
      dataFor(path, fetchData).then(
        (result) => {
          if (id !== navigationId.current) return;
          setLoading(false);
          dataCache.current.delete(path); // revenir plus tard sur la page recharge ses données
          then(result.found, result.found ? result.data : undefined);
        },
        (error: unknown) => {
          if (id !== navigationId.current) return;
          setLoading(false);
          console.error(`[better] Chargement des données de ${path} impossible :`, error);
          window.location.assign(path);
        }
      );
    },
    [dataFor]
  );

  const [stack, setStack] = useState<StackEntry[]>(() => {
    if (props.initialPage) return [{ id: nextId(), element: props.initialPage }];
    const path =
      props.initialPath ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    // Route lazy : titre inconnu ici, on garde celui posé par le serveur
    // pour pouvoir le restaurer au retour sur cette page.
    const title =
      titleForPath(path, props.initialData) ?? (typeof document !== "undefined" ? document.title : undefined);
    // Données déjà chargées par le serveur : pas de nouvel appel.
    return [{ id: nextId(), element: pageForPath(path, props.initialData), title }];
  });
  const stackRef = useRef(stack);
  stackRef.current = stack;

  // Met à jour le titre de l'onglet lors des navigations côté client
  // (au premier chargement, c'est le serveur qui l'a déjà posé).
  const topTitle = stack[stack.length - 1]?.title;
  useEffect(() => {
    if (topTitle !== undefined) document.title = topTitle;
  }, [topTitle]);

  // --- intégration avec le bouton "retour" du navigateur ---
  useEffect(() => {
    if (!syncWithBrowserHistory || typeof window === "undefined") return;

    window.history.replaceState(
      {
        ...window.history.state,
        [HISTORY_DEPTH_KEY]: 1,
        [HISTORY_PATH_KEY]: window.location.pathname,
      },
      ""
    );

    function onPopState(event: PopStateEvent) {
      const state = event.state as Record<string, unknown> | null;
      const targetDepth =
        typeof state?.[HISTORY_DEPTH_KEY] === "number"
          ? (state[HISTORY_DEPTH_KEY] as number)
          : 1;
      const targetPath = state?.[HISTORY_PATH_KEY];

      // Retour en arrière : les pages du dessous sont restées montées.
      if (targetDepth < stackRef.current.length) {
        navigationId.current++; // annule un chargement de données en cours
        setLoading(false);
        setStack((prev) => prev.slice(0, Math.max(1, targetDepth)));
        return;
      }
      // Avancer d'une page n'est reconstructible que pour une route nommée
      // (on connaît son URL) ; une page poussée avec push(<Page />) est perdue.
      if (targetDepth === stackRef.current.length + 1 && routesRef.current && typeof targetPath === "string") {
        withData(targetPath, (found, data) => {
          const element = found ? pageForPath(targetPath, data) : unknownPage(targetPath);
          const entry = { id: nextId(), element, title: titleForPath(targetPath, data) };
          setStack((prev) => (prev.length === targetDepth - 1 ? [...prev, entry] : prev));
        });
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [syncWithBrowserHistory, pageForPath, titleForPath, unknownPage, withData]);

  const pushEntry = useCallback(
    (element: ReactElement, path?: string, title?: string) => {
      // Hors du updater de setStack : en StrictMode il est appelé deux fois,
      // ce qui créerait deux entrées d'historique.
      if (syncWithBrowserHistory && typeof window !== "undefined") {
        window.history.pushState(
          {
            [HISTORY_DEPTH_KEY]: stackRef.current.length + 1,
            [HISTORY_PATH_KEY]: path ?? window.location.pathname,
          },
          "",
          path
        );
      }
      // Une page sans route garde le titre de la page du dessous.
      const entry = { id: nextId(), element, title: title ?? stackRef.current[stackRef.current.length - 1]?.title };
      setStack((prev) => [...prev, entry]);
      return entry.id;
    },
    [syncWithBrowserHistory]
  );

  const push = useCallback(
    (page: ReactElement | WidgetClass, props?: object) =>
      pushEntry(isValidElement(page) ? page : renderWidget(page, props)),
    [pushEntry]
  );

  const pushNamed = useCallback(
    (route: string | PageClass, ...args: unknown[]) => {
      if (!routesRef.current) {
        throw new Error("pushNamed() nécessite `routes` sur le <NavigatorProvider>.");
      }
      const pattern = typeof route === "string" ? route : route.route;
      const path = buildPath(pattern, args[0] as Record<string, string> | undefined);

      // Page avec `static load` : la page actuelle reste affichée (barre de
      // chargement en haut) jusqu'à l'arrivée des données.
      withData(path, (found, data) => {
        if (!found) {
          pushEntry(unknownPage(path), path);
          return;
        }
        const title = titleForPath(path, data);
        const id = pushEntry(pageForPath(path, data), path, title);

        // Route lazy : le titre n'est connu qu'une fois le code de la page chargé.
        if (title === undefined && routesRef.current) {
          loadRouteMetadata(routesRef.current, path, data).then((metadata) => {
            if (metadata?.title === undefined) return;
            setStack((prev) =>
              prev.map((entry) => (entry.id === id ? { ...entry, title: metadata.title } : entry))
            );
          });
        }
      });
    },
    [pushEntry, pageForPath, titleForPath, unknownPage, withData]
  );

  const prefetch = useCallback(
    (path: string, options?: { data?: boolean }) => {
      if (!routesRef.current) return;
      preloadRoute(routesRef.current, path);
      const fetchData = options?.data ? routeDataFetcher(routesRef.current, path) : undefined;
      if (fetchData) dataFor(path, fetchData).catch(() => {});
    },
    [dataFor]
  );

  const pop = useCallback(() => {
    if (stackRef.current.length <= 1) return;

    if (syncWithBrowserHistory && typeof window !== "undefined") {
      // Le vrai dépilement se fait dans onPopState, pour ne jamais
      // désynchroniser l'historique du navigateur et la pile interne.
      window.history.back();
    } else {
      setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }
  }, [syncWithBrowserHistory]);

  const replace = useCallback(
    (page: ReactElement) => {
      setStack((prev) => [
        ...prev.slice(0, -1),
        { id: nextId(), element: page, title: prev[prev.length - 1]?.title },
      ]);
      if (syncWithBrowserHistory && typeof window !== "undefined") {
        window.history.replaceState(
          { ...window.history.state, [HISTORY_DEPTH_KEY]: stackRef.current.length },
          ""
        );
      }
    },
    [syncWithBrowserHistory]
  );

  const handle = useMemo<NavigatorHandle>(
    () => ({
      push: push as NavigatorHandle["push"],
      pushNamed: pushNamed as NavigatorHandle["pushNamed"],
      prefetch,
      pop,
      replace,
      canPop: stack.length > 1,
      depth: stack.length,
    }),
    [push, pushNamed, prefetch, pop, replace, stack.length]
  );

  return (
    <NavigatorContext.Provider value={handle}>
      {loading && (
        <MuiLinearProgress
          aria-label="Chargement de la page"
          sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000, height: 3 }}
        />
      )}
      {stack.map((entry, index) => (
        <div key={entry.id} hidden={index !== stack.length - 1}>
          {entry.element}
        </div>
      ))}
      {props.children}
    </NavigatorContext.Provider>
  );
}

/**
 * Récupère le `NavigatorHandle` du `NavigatorProvider` englobant —
 * l'équivalent de `Navigator.of(context)` en Flutter.
 * Passer le type des routes pour typer `pushNamed` : `useNavigator<typeof routes>()`.
 */
export function useNavigator<R extends Routes = Routes>(): NavigatorHandle<R> {
  const handle = useContext(NavigatorContext);
  if (!handle) {
    throw new Error(
      "useNavigator() doit être appelé à l'intérieur d'un <NavigatorProvider>."
    );
  }
  return handle as unknown as NavigatorHandle<R>;
}

/** Comme `useNavigator`, mais renvoie `null` hors d'un `NavigatorProvider` (ex. AppBar). */
export function useMaybeNavigator(): NavigatorHandle | null {
  return useContext(NavigatorContext);
}
