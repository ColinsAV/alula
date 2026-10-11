"use client";

import { useMemo, type ReactElement } from "react";
import { MultiProvider } from "../state/changeNotifier";
import { NavigatorProvider } from "../navigation/Navigator";
import { routesFromPages, type PageClass } from "../navigation/pageRoutes";
import type { Routes } from "../navigation/routes";
import { ThemeProvider } from "../theme/ThemeProvider";
import type { AppThemeConfig, ThemeMode } from "../theme/types";
import { OverlayHost } from "../widgets/overlays";

export interface MaterialAppProps {
  /** Titre par défaut de l'app (onglet, SEO) — comme `title` en Flutter. */
  title?: string;
  /** Langue du document (`<html lang>`). Par défaut `"fr"`. */
  locale?: string;
  /**
   * État partagé par toute l'app :
   * `providers={[ChangeNotifierProvider({ create: () => new CartModel() })]}`.
   */
  providers?: ReactElement[];
  /** Thème clair (ou unique) : couleurs, police, styles des composants. */
  theme?: AppThemeConfig;
  /** Thème sombre, utilisé selon `themeMode`. */
  darkTheme?: AppThemeConfig;
  /**
   * Mode par défaut. `system` (défaut) : suit le réglage de l'appareil.
   * Modifiable ensuite par `useThemeMode()` / `ThemeModeButton`.
   */
  themeMode?: ThemeMode;
  /**
   * Les pages de l'app : des widgets portant `static route`. Inutile avec la
   * CLI `better`, qui les trouve seule et les charge à la demande.
   */
  routes?: PageClass[];
  /** Table de routes déjà construite — injectée par le code généré par la CLI. */
  routeTable?: Routes;
  /** Page affichée si aucune route ne correspond. */
  onUnknownRoute?: (path: string) => ReactElement;
  /** URL publique du site, pour le sitemap. Par défaut `process.env.SITE_URL`. */
  siteUrl?: string;
  /** URLs de routes à paramètres à ajouter au sitemap (ex. `"/greeting/Bob"`). */
  sitemapPaths?: string[];
  /** URL de la première page — fournie par le code Next généré. */
  initialPath?: string;
  /** Données de la première page (`static load`) — fournies par le code Next généré. */
  initialData?: unknown;
}

/**
 * La racine de l'app, comme `MaterialApp` en Flutter : thème, Navigator
 * construit à partir des pages, et pop-up (dialogs, snackbars…).
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
    <ThemeProvider theme={theme} darkTheme={darkTheme} themeMode={themeMode}>
      <MultiProvider
        providers={providers}
        child={
          <NavigatorProvider
            routes={table}
            initialPath={initialPath}
            initialData={initialData}
            onUnknownRoute={onUnknownRoute}
          >
            <OverlayHost />
          </NavigatorProvider>
        }
      />
    </ThemeProvider>
  );
}
