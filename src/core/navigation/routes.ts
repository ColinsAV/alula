import type { ReactElement } from "react";

/**
 * Extrait les noms de paramètres d'un motif de route :
 * `'/article/:id/comment/:commentId'` → `'id' | 'commentId'`.
 */
export type RouteParamNames<P extends string> =
  P extends `${string}:${infer Name}/${infer Rest}`
    ? Name | RouteParamNames<`/${Rest}`>
    : P extends `${string}:${infer Name}`
      ? Name
      : never;

/** Les paramètres typés d'une route — `{}` si le motif n'en a aucun. */
export type RouteParams<P extends string> = {
  [K in RouteParamNames<P>]: string;
};

/** Construit la page d'une route à partir de ses paramètres (et de ses données, si `load`). */
export type RouteBuilder<P extends string> = (params: RouteParams<P>, data?: unknown) => ReactElement;

/**
 * Résultat du chargement des données d'une page (`static load`).
 * `found: false` : `load` n'a rien trouvé (null / undefined) → 404.
 */
export type LoadResult = { found: true; data: unknown } | { found: false };

/** Métadonnées d'une route, calculées à partir de ses paramètres et de ses données. */
export type MetadataBuilder<P extends string> = (params: RouteParams<P>, data?: any) => RouteMetadata;

/**
 * Métadonnées SEO d'une route. Sous-ensemble compatible avec le type
 * `Metadata` de Next, sans dépendre de Next.
 */
export interface RouteMetadata {
  title?: string;
  description?: string;
  /**
   * Image d'aperçu pour les partages (Open Graph, Twitter) : URL absolue,
   * ou chemin relatif au site (`"/og/home.png"`). Idéalement 1200×630.
   */
  image?: string;
}

/** Une route : soit directement son builder, soit un builder + ses métadonnées. */
export type RouteDefinition<P extends string> =
  | RouteBuilder<P>
  | {
      page: RouteBuilder<P>;
      metadata?: MetadataBuilder<P>;
      /**
       * Charge les données de la page (son `static load`), exécuté sur le
       * serveur. Reçoit l'URL. Absent : la page n'a pas de données.
       */
      fetchData?: (path: string) => Promise<LoadResult>;
      /** Route chargée à la demande : télécharge le code de la page à l'avance (survol d'un lien…). */
      preload?: () => void;
      /** Route chargée à la demande : métadonnées disponibles une fois le code de la page chargé. */
      loadMetadata?: () => Promise<MetadataBuilder<P> | undefined>;
    };

/** Table de routes : motif d'URL → définition — l'équivalent de `routes` dans un `MaterialApp`. */
export type Routes = Record<string, RouteDefinition<any>>;

/**
 * Déclare une table de routes en typant les paramètres de chaque builder
 * d'après son motif :
 *
 * ```tsx
 * const routes = defineRoutes({
 *   "/": () => <HomePage />,
 *   "/article/:id": {
 *     page: ({ id }) => <ArticlePage id={id} />,
 *     metadata: ({ id }) => ({ title: `Article ${id}` }),
 *   },
 * });
 * ```
 */
export function defineRoutes<R extends Record<string, unknown>>(routes: {
  [P in keyof R]: RouteDefinition<P & string>;
}): { [P in keyof R]: RouteDefinition<P & string> } {
  return routes;
}

/** Arguments de `pushNamed` : les paramètres ne sont demandés que si le motif en contient. */
export type PushNamedArgs<P extends string> = [RouteParamNames<P>] extends [never]
  ? []
  : [params: RouteParams<P>];

function splitPath(path: string): string[] {
  return path.split("?")[0]!.split("/").filter(Boolean);
}

/** Remplit un motif avec ses paramètres : `('/article/:id', { id: '42' })` → `'/article/42'`. */
export function buildPath(pattern: string, params: Record<string, string> = {}): string {
  const segments = splitPath(pattern).map((segment) =>
    segment.startsWith(":") ? encodeURIComponent(params[segment.slice(1)] ?? "") : segment
  );
  return "/" + segments.join("/");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

interface RouteMatch {
  pattern: string;
  params: Record<string, string>;
  definition: RouteDefinition<any>;
}

/** Cherche la route correspondant à une URL et renvoie son motif et ses paramètres, ou `null`. */
export function matchRoute(routes: Routes, path: string): RouteMatch | null {
  const pathSegments = splitPath(path);

  for (const [pattern, definition] of Object.entries(routes)) {
    const patternSegments = splitPath(pattern);
    if (patternSegments.length !== pathSegments.length) continue;

    const params: Record<string, string> = {};
    const matches = patternSegments.every((segment, i) => {
      const value = pathSegments[i]!;
      if (segment.startsWith(":")) {
        params[segment.slice(1)] = safeDecode(value);
        return true;
      }
      return segment === value;
    });

    if (matches) return { pattern, params, definition };
  }

  return null;
}

/** Construit la page correspondant à une URL, ou `null` si aucune route ne correspond. */
export function resolveRoute(routes: Routes, path: string, data?: unknown): ReactElement | null {
  const match = matchRoute(routes, path);
  if (!match) return null;
  const builder = typeof match.definition === "function" ? match.definition : match.definition.page;
  return builder(match.params, data);
}

/** Métadonnées de la route correspondant à une URL — `null` si aucune route ou aucune métadonnée. */
export function resolveMetadata(routes: Routes, path: string, data?: unknown): RouteMetadata | null {
  const match = matchRoute(routes, path);
  if (!match || typeof match.definition === "function") return null;
  return match.definition.metadata?.(match.params, data) ?? null;
}

/** Comme `resolveMetadata`, mais charge le code de la page si la route est lazy. */
export async function loadRouteMetadata(
  routes: Routes,
  path: string,
  data?: unknown
): Promise<RouteMetadata | null> {
  const match = matchRoute(routes, path);
  if (!match || typeof match.definition === "function") return null;
  const metadata = match.definition.metadata ?? (await match.definition.loadMetadata?.());
  return metadata?.(match.params, data) ?? null;
}

/** Le chargeur de données de la route d'une URL, si sa page a un `static load`. */
export function routeDataFetcher(routes: Routes, path: string): ((path: string) => Promise<LoadResult>) | undefined {
  const match = matchRoute(routes, path);
  return match && typeof match.definition !== "function" ? match.definition.fetchData : undefined;
}

/** Précharge le code de la page d'une URL, si sa route est lazy. */
export function preloadRoute(routes: Routes, path: string): void {
  const match = matchRoute(routes, path);
  if (match && typeof match.definition !== "function") match.definition.preload?.();
}

/** Les routes sans paramètre (`'/'`, `'/about'`…) — utile pour générer un sitemap. */
export function staticPaths(routes: Routes): string[] {
  return Object.keys(routes).filter((pattern) => !pattern.includes(":"));
}
