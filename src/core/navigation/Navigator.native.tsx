import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { Text } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  StackActions,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNativeTheme } from "../theme/nativeTheme";
import { renderWidget, type PageClass, type WidgetClass } from "./pageRoutes";
import { buildPath, resolveRoute, routeDataFetcher, type Routes } from "./routes";
import type { NavigatorHandle, NavigatorProviderProps } from "./types";

// Le Navigator sur mobile : une vraie pile native (React Navigation), avec le
// geste et le bouton retour du système. Même API que sur le web.

type StackParams = { page: { id: number } };

const Stack = createNativeStackNavigator<StackParams>();
const NavigatorContext = createContext<NavigatorHandle | null>(null);

export function NavigatorProvider(props: NavigatorProviderProps) {
  const { routes, onUnknownRoute } = props;
  const theme = useNativeTheme().data;
  const navigation = useNavigationContainerRef<StackParams>();

  const routesRef = useRef<Routes | undefined>(routes);
  routesRef.current = routes;

  const pageForPath = useCallback(
    (path: string, data?: unknown): ReactElement =>
      (routesRef.current ? resolveRoute(routesRef.current, path, data) : null) ??
      onUnknownRoute?.(path) ?? <Text>Page introuvable : {path}</Text>,
    [onUnknownRoute]
  );

  // Les pages de la pile, par identifiant (React Navigation ne transporte
  // que des paramètres sérialisables, pas des éléments React).
  const pages = useRef(new Map<number, ReactElement>());
  const lastId = useRef(1);
  if (!pages.current.has(1)) {
    pages.current.set(1, props.initialPage ?? pageForPath(props.initialPath ?? "/", props.initialData));
  }

  const [depth, setDepth] = useState(1);

  const pushEntry = useCallback(
    (element: ReactElement, replace = false) => {
      const id = ++lastId.current;
      pages.current.set(id, element);
      navigation.dispatch((replace ? StackActions.replace : StackActions.push)("page", { id }));
    },
    [navigation]
  );

  const push = useCallback(
    (page: ReactElement | WidgetClass, widgetProps?: object) =>
      pushEntry(isValidElement(page) ? page : renderWidget(page, widgetProps)),
    [pushEntry]
  );

  const pushNamed = useCallback(
    async (route: string | PageClass, ...args: unknown[]) => {
      if (!routesRef.current) throw new Error("pushNamed() nécessite `routes` sur le <NavigatorProvider>.");
      const pattern = typeof route === "string" ? route : route.route;
      const path = buildPath(pattern, args[0] as Record<string, string> | undefined);
      // Page avec `static load` : sur mobile, exécuté dans l'app (phase 1).
      const fetchData = routeDataFetcher(routesRef.current, path);
      if (!fetchData) return pushEntry(pageForPath(path));
      try {
        const result = await fetchData(path);
        pushEntry(result.found ? pageForPath(path, result.data) : onUnknownRoute?.(path) ?? pageForPath("/__404__"));
      } catch (error) {
        console.error(`[better] Chargement des données de ${path} impossible :`, error);
      }
    },
    [pushEntry, pageForPath, onUnknownRoute]
  );

  const pop = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const replace = useCallback((page: ReactElement) => pushEntry(page, true), [pushEntry]);

  const handle = useMemo<NavigatorHandle>(
    () => ({
      push: push as NavigatorHandle["push"],
      pushNamed: pushNamed as NavigatorHandle["pushNamed"],
      prefetch: () => {},
      pop,
      replace,
      canPop: depth > 1,
      depth,
    }),
    [push, pushNamed, pop, replace, depth]
  );

  // Composant d'écran stable : il affiche la page de son identifiant.
  const PageScreen = useMemo(
    () =>
      function PageScreen({ route }: { route: { params: { id: number } } }) {
        return pages.current.get(route.params.id) ?? null;
      },
    []
  );

  const base = theme.brightness === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colorScheme.primary,
      background: theme.colorScheme.background,
      card: theme.colorScheme.surface,
      text: theme.colorScheme.onSurface,
      border: theme.colorScheme.outline,
    },
  };

  return (
    <NavigatorContext.Provider value={handle}>
      <NavigationContainer
        ref={navigation}
        theme={navigationTheme}
        onStateChange={(state) => {
          setDepth(state?.routes.length ?? 1);
          // Libère les pages qui ne sont plus dans la pile.
          const alive = new Set(state?.routes.map((r) => (r.params as { id: number }).id));
          for (const id of pages.current.keys()) if (!alive.has(id)) pages.current.delete(id);
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="page" component={PageScreen} initialParams={{ id: 1 }} />
        </Stack.Navigator>
      </NavigationContainer>
      {props.children}
    </NavigatorContext.Provider>
  );
}

/** Le `NavigatorHandle` du `NavigatorProvider` englobant — `Navigator.of(context)` en Flutter. */
export function useNavigator<R extends Routes = Routes>(): NavigatorHandle<R> {
  const handle = useContext(NavigatorContext);
  if (!handle) throw new Error("useNavigator() doit être appelé à l'intérieur d'un <NavigatorProvider>.");
  return handle as unknown as NavigatorHandle<R>;
}

/** Comme `useNavigator`, mais renvoie `null` hors d'un `NavigatorProvider`. */
export function useMaybeNavigator(): NavigatorHandle | null {
  return useContext(NavigatorContext);
}
