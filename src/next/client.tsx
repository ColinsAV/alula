"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import type { LoadResult, RouteDefinition } from "../core/navigation/routes";
import type { PageClass } from "../core/navigation/pageRoutes";

/**
 * Route chargée à la demande, utilisée par .better/routes.client.tsx (généré) :
 * `Component` vient de `next/dynamic` (rendu serveur + chunk séparé),
 * `load` importe le module de la page (préchargement, métadonnées),
 * `fetchData` (pages avec `static load`) appelle la Server Action générée.
 */
export function lazyRoute(
  Component: ComponentType<any>,
  load: () => Promise<PageClass>,
  fetchData?: (path: string) => Promise<LoadResult>
): RouteDefinition<any> {
  return {
    page: (params, data) => <Component {...params} {...(data !== undefined && { data })} />,
    preload: () => void load(),
    loadMetadata: () => load().then((Page) => Page.metadata),
    fetchData,
  };
}

/**
 * Styles MUI (Emotion) rendus côté serveur, dans le HTML : la page arrive
 * déjà stylée, sans flash au chargement. Utilisé par le layout généré.
 */
export function StyleRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "mui" });
    cache.compat = true;
    // Note les styles insérés pendant le rendu, pour les envoyer dans le HTML.
    let inserted: string[] = [];
    const insert = cache.insert;
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) inserted.push(serialized.name);
      return insert(...args);
    };
    const flush = () => {
      const names = inserted;
      inserted = [];
      return names;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    const styles = names
      .map((name) => cache.inserted[name])
      .filter((style): style is string => typeof style === "string")
      .join("");
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
