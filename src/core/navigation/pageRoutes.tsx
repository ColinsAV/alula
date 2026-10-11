import type { ReactElement } from "react";
import { StatefulWidget } from "../statefullWidget";
import { MyStatelessWidget, type StatelessWidget } from "../statelessWidget";
import { StatefulWidgetComponent } from "../StatefulWidgetComponent";
import { matchRoute, type LoadResult, type RouteMetadata, type Routes } from "./routes";

/** Une classe de widget (Stateless ou Stateful) construite à partir de ses props. */
export type WidgetClass<Props extends object = any> = new (
  props: Props
) => StatelessWidget<any> | StatefulWidget<any, any>;

/**
 * Une page : un widget qui déclare sa route, comme `@TypedGoRoute` avec
 * go_router_builder. Les paramètres de la route deviennent ses props.
 *
 * ```tsx
 * class GreetingPage extends StatelessWidget<{ name: string }> {
 *   static route = "/greeting/:name";
 *   static metadata = ({ name }: { name: string }) => ({ title: `Bonjour ${name}` });
 *   build() { ... }
 * }
 * ```
 *
 * Avec des données chargées côté serveur (`static load`), reçues dans `props.data` :
 * ```tsx
 * async function load({ slug }: { slug: string }) {
 *   return db.article.find(slug); // null → page 404
 * }
 *
 * class ArticlePage extends StatelessWidget<{ slug: string; data: Loaded<typeof load> }> {
 *   static route = "/blog/:slug";
 *   static load = load;
 *   static metadata = (_: { slug: string }, article: Loaded<typeof load>) => ({ title: article.title });
 *   build() { return Text(this.props.data.title); }
 * }
 * ```
 */
export type PageClass = WidgetClass & {
  route: string;
  metadata?: (params: any, data?: any) => RouteMetadata;
  /**
   * Charge les données de la page, toujours sur le serveur (base de données,
   * clé d'API secrète…). Ce qu'elle renvoie doit être sérialisable (JSON).
   * `null` / `undefined` : la page n'existe pas (404).
   */
  load?: (params: any) => unknown;
};

/** Les données chargées par un `static load` (sans le cas null, qui donne une 404). */
export type Loaded<F extends (...args: any[]) => unknown> = NonNullable<Awaited<ReturnType<F>>>;

/**
 * Exécute le `static load` de la page qui correspond à `path`.
 * Côté serveur : rendu de la page, métadonnées et Server Action de navigation.
 */
export async function loadPageData(pages: PageClass[], path: string): Promise<LoadResult & { page?: PageClass }> {
  const routes: Routes = Object.fromEntries(pages.map((Page) => [Page.route, () => null as never]));
  const match = matchRoute(routes, path);
  const Page = match && pages.find((p) => p.route === match.pattern);
  if (!match || !Page) return { found: false };
  if (!Page.load) return { found: true, data: undefined, page: Page };
  const data = await Page.load(match.params);
  return data === null || data === undefined ? { found: false } : { found: true, data, page: Page };
}

/** Props d'une page : ses paramètres de route, plus `data` si elle a un `static load`. */
const pageProps = (params: object, data: unknown) => (data === undefined ? params : { ...params, data });

/** Rend un widget à partir de sa classe et de ses props. */
export function renderWidget<P extends object>(Widget: WidgetClass<P>, props?: P): ReactElement {
  if (Widget.prototype instanceof StatefulWidget) {
    return <StatefulWidgetComponent Component={Widget as any} props={props} />;
  }
  return <MyStatelessWidget Component={Widget as any} {...props} />;
}

/** Transforme une classe de widget en composant React (utilisé par les routes lazy). */
export function widgetComponent<P extends object>(Widget: WidgetClass<P>) {
  return function WidgetComponent(props: P) {
    return renderWidget(Widget, props);
  };
}

/** Construit la table de routes à partir des `static route` / `static metadata` des pages. */
export function routesFromPages(pages: PageClass[]): Routes {
  const routes: Routes = {};
  for (const Page of pages) {
    routes[Page.route] = {
      page: (params, data) => renderWidget(Page, pageProps(params, data)),
      metadata: Page.metadata,
      // Sans la CLI (pas de serveur) : `load` s'exécute dans le navigateur.
      fetchData: Page.load
        ? async (path) => {
            const { page: _, ...result } = await loadPageData([Page], path);
            return result;
          }
        : undefined,
    };
  }
  return routes;
}
