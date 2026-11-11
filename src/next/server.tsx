import { cache, type ComponentType, type ReactNode } from "react";
import type { Metadata, MetadataRoute } from "next";
import { notFound } from "next/navigation";
import { loadPageData, routesFromPages, type PageClass } from "../core/navigation/pageRoutes";
import { resolveMetadata, staticPaths, type Routes } from "../core/navigation/routes";
import type { App } from "../core/app/runApp";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { StyleRegistry } from "./client";

// Helpers utilisés par les fichiers générés dans .alula/app/ par la CLI `alula`.
// Côté serveur : ils lisent les props du <MaterialApp> et les pages du
// manifeste généré (.alula/routes.server.ts, imports non lazy).

type PathParams = { path?: string[] };
// Next 15 : les paramètres de la route arrivent sous forme de promesse.
type CatchAllProps = { params: Promise<PathParams> };

const toPath = (params: PathParams) => "/" + (params.path ?? []).join("/");

/** Données d'une page pour la Server Action générée : sans la classe, non sérialisable. */
export async function loadRouteData(pages: PageClass[], path: string) {
  const { page: _, ...result } = await loadPageData(pages, path);
  return result;
}

/** URLs connues à l'avance : routes sans paramètre + `sitemapPaths`. */
const knownPaths = (app: App, routes: Routes) => [
  ...staticPaths(routes),
  ...(app.props.sitemapPaths ?? []),
];

/** URL publique du site : `siteUrl` du <MaterialApp>, sinon `SITE_URL`. */
const getSiteUrl = (app: App) =>
  app.props.siteUrl ?? process.env.SITE_URL ?? "http://localhost:3000";

/** `app/layout.tsx` : `<html>`, `<body>` et le titre par défaut. */
export function createRootLayout(app: App) {
  const { title, locale = "fr", themeMode = "system" } = app.props;

  const metadata: Metadata = {
    // Rend absolues les URLs relatives (canonique, Open Graph…) de toutes les pages.
    metadataBase: new URL(getSiteUrl(app)),
    ...(title ? { title } : {}),
  };

  function RootLayout({ children }: { children: ReactNode }) {
    return (
      <html lang={locale} suppressHydrationWarning>
        <body>
          {/* Pose la classe light / dark sur <html> avant l'affichage : pas de flash. */}
          <InitColorSchemeScript attribute="class" defaultMode={themeMode} />
          <StyleRegistry>{children}</StyleRegistry>
        </body>
      </html>
    );
  }

  return { metadata, RootLayout };
}

/**
 * `app/[[...path]]/page.tsx` : pré-rendu des URLs connues, métadonnées de la
 * route, 404, puis rendu côté client.
 */
export function createPage(
  app: App,
  pages: PageClass[],
  Client: ComponentType<{ initialPath: string; initialData?: unknown }>
) {
  const routes = routesFromPages(pages);
  // `cache` de React : un seul appel à `load` par requête, partagé entre
  // generateMetadata et la page.
  const load = cache((path: string) => loadPageData(pages, path));

  // Pré-rendues au build. Les autres URLs valides (/greeting/Alice…) sont
  // rendues à la première visite puis mises en cache (dynamicParams par défaut).
  function generateStaticParams(): PathParams[] {
    return knownPaths(app, routes).map((path) => ({ path: path.split("/").filter(Boolean) }));
  }

  async function generateMetadata({ params }: CatchAllProps): Promise<Metadata> {
    const path = toPath(await params);
    const result = await load(path);
    if (!result.found) return {}; // 404 : pas d'URL canonique

    const { title, description, image } = resolveMetadata(routes, path, result.data) ?? {};
    const shareTitle = title ?? app.props.title;
    const images = image ? [image] : undefined;

    return {
      // Omis s'ils sont absents, pour garder le titre par défaut du layout.
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      // Construit depuis les segments : jamais de query string (?utm_…).
      alternates: { canonical: path },
      // Aperçu des partages. Défini en entier ici : Next ne fusionne pas
      // l'openGraph d'une page avec celui du layout.
      openGraph: {
        type: "website",
        url: path,
        siteName: app.props.title,
        title: shareTitle,
        description,
        images,
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: shareTitle,
        description,
        images,
      },
    };
  }

  async function Page({ params }: CatchAllProps) {
    const path = toPath(await params);
    // Vraie 404 pour les moteurs de recherche : aucune route, ou `load` n'a rien trouvé.
    const result = await load(path);
    if (!result.found) notFound();
    // Les données partent dans le HTML : le navigateur ne refait pas l'appel.
    return <Client initialPath={path} initialData={result.data} />;
  }

  return { generateStaticParams, generateMetadata, Page };
}

/** `app/robots.ts` : tout autoriser et indiquer le sitemap. */
export function createRobots(app: App) {
  const siteUrl = getSiteUrl(app);

  return function robots(): MetadataRoute.Robots {
    return {
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  };
}

/** `app/sitemap.ts` : routes sans paramètre + `sitemapPaths`. */
export function createSitemap(app: App, pages: PageClass[]) {
  const siteUrl = getSiteUrl(app);
  const routes = routesFromPages(pages);

  return function sitemap(): MetadataRoute.Sitemap {
    return knownPaths(app, routes).map((path) => ({ url: siteUrl + path }));
  };
}
