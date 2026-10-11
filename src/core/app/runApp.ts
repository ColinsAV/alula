import type { ReactElement } from "react";
import type { MaterialAppProps } from "./MaterialApp";

export type App = ReactElement<MaterialAppProps>;

/**
 * Point d'entrée de l'app, comme `runApp` en Flutter :
 *
 * ```tsx
 * // lib/main.tsx
 * export default runApp(<MaterialApp title="Mon app" routes={[HomePage, GreetingPage]} />);
 * ```
 *
 * Le code Next généré par la CLI `better` (dans .better/) lit cet export (routes, métadonnées,
 * sitemap) et le rend.
 */
export function runApp(app: App): App {
  return app;
}
