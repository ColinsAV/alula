// Widgets
export { StatelessWidget, MyStatelessWidget } from "./core/statelessWidget";
export { StatefulWidget } from "./core/statefullWidget";
export { StatefulWidgetComponent, useStatefulWidget } from "./core/StatefulWidgetComponent";

// Widgets prêts à l'emploi (Container, Row, Column, Text, ListView, ElevatedButton…)
export * from "./core/widgets";

// État partagé (ChangeNotifier, Provider…)
export * from "./core/state/changeNotifier";
export { Provider } from "./core/state/provider";

// App
export { MaterialApp, type MaterialAppProps } from "./core/app/MaterialApp";
export { runApp, type App } from "./core/app/runApp";

// Navigation
export { NavigatorProvider, useNavigator } from "./core/navigation/Navigator";
export { NavLink, type NavLinkProps } from "./core/navigation/NavLink";
export {
  renderWidget,
  routesFromPages,
  widgetComponent,
  type Loaded,
  type PageClass,
  type WidgetClass,
} from "./core/navigation/pageRoutes";
export {
  defineRoutes,
  buildPath,
  matchRoute,
  resolveRoute,
  resolveMetadata,
  loadRouteMetadata,
  preloadRoute,
  staticPaths,
  type LoadResult,
  type RouteMetadata,
  type RouteParams,
  type Routes,
} from "./core/navigation/routes";
export type { NavigatorHandle, NavigatorProviderProps } from "./core/navigation/types";

// Thème
export { ThemeProvider, type ThemeProviderProps } from "./core/theme/ThemeProvider";
export { buildMuiTheme } from "./core/theme/buildMuiTheme";
export * from "./core/theme/types";
export { Theme, type ThemeData, type ColorScheme, type TextTheme } from "./core/theme/themeOf";
export { useThemeMode, ThemeModeButton, type ThemeModeHandle } from "./core/theme/themeMode";
