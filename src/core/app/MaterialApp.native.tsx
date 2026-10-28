import { useMemo, type ReactElement } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigatorProvider } from "../navigation/Navigator.native";
import { routesFromPages } from "../navigation/pageRoutes";
import { MultiProvider } from "../state/changeNotifier";
import { OverlayHost } from "../widgets/overlays.native";
import { useNativeTheme } from "../theme/nativeTheme";
import { ThemeProvider } from "../theme/ThemeProvider.native";
import type { MaterialAppProps } from "./MaterialApp";

export type { MaterialAppProps } from "./MaterialApp";

/**
 * La racine de l'app sur mobile : zones sûres (encoche, barre d'état),
 * thème, état partagé, Navigator et pop-up. Les props propres au web (SEO, sitemap…)
 * sont ignorées.
 */
export function MaterialApp({
  theme,
  darkTheme,
  themeMode,
  providers = [],
  routes,
  routeTable,
  onUnknownRoute,
  initialPath,
  initialData,
}: MaterialAppProps) {
  const table = useMemo(() => routeTable ?? routesFromPages(routes ?? []), [routeTable, routes]);
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme} darkTheme={darkTheme} themeMode={themeMode}>
        <ThemedStatusBar />
        <MultiProvider
          providers={providers}
          child={
            <NavigatorProvider
              routes={table}
              initialPath={initialPath ?? "/"}
              initialData={initialData}
              onUnknownRoute={onUnknownRoute}
            >
              <OverlayHost />
            </NavigatorProvider>
          }
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Texte de la barre d'état clair sur l'AppBar (couleur primaire). */
function ThemedStatusBar(): ReactElement {
  const { brightness } = useNativeTheme().data;
  return <StatusBar barStyle={brightness === "dark" ? "dark-content" : "light-content"} />;
}
