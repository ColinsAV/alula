import type { ReactElement, ReactNode } from "react";
import type { PushNamedArgs, Routes } from "./routes";
import type { PageClass, WidgetClass } from "./pageRoutes";

/**
 * Ce que `useNavigator()` renvoie : l'équivalent de l'objet `Navigator`
 * qu'on récupère avec `Navigator.of(context)` en Flutter.
 */
/** Props d'une page, demandées seulement si elle en a d'obligatoires. */
export type PageArgs<C> = C extends new (props: infer P) => any
  ? {} extends P
    ? [params?: P]
    : [params: P]
  : [];

export interface NavigatorHandle<R extends Routes = Routes> {
  /**
   * Empile une nouvelle page — l'équivalent de
   * `Navigator.push(context, MaterialPageRoute(builder: (_) => DetailPage(item: x)))`.
   * On passe directement l'élément déjà construit avec ses props
   * (`push(<DetailPage article={article} />)`), donc le typage vient
   * gratuitement du JSX/TSX : pas de table de routes en string, pas de
   * `params` non typés.
   */
  push: {
    (page: ReactElement): void;
    /** Empile un widget à partir de sa classe : `push(DetailPage, { id: 42 })`. */
    <P extends object>(widget: WidgetClass<P>, ...props: {} extends P ? [props?: P] : [props: P]): void;
  };

  /**
   * Empile la page d'une route nommée et met à jour l'URL — l'équivalent de
   * `Navigator.pushNamed(context, '/article', arguments: ...)`.
   * Les paramètres sont typés d'après le motif : `pushNamed('/article/:id', { id: '42' })`.
   * Nécessite `routes` sur le `NavigatorProvider`.
   */
  pushNamed: {
    <P extends keyof R & string>(route: P, ...args: PushNamedArgs<P>): void;
    /** Par la classe de la page : `pushNamed(GreetingPage, { name: "Bob" })`. */
    <C extends PageClass>(page: C, ...args: PageArgs<C>): void;
  };

  /**
   * Dépile la page courante et révèle celle du dessous, qui était restée
   * montée (donc son état est intact) — comme `Navigator.pop(context)`.
   * Ne fait rien si la pile ne contient que la page racine.
   */
  pop: () => void;

  /**
   * Télécharge à l'avance le code de la page d'une URL (routes lazy), pour
   * une navigation instantanée. Appelé par `NavLink` au survol / à l'affichage.
   * `data: true` : charge aussi ses données (`static load`), gardées 30 s —
   * `NavLink` ne le fait qu'au survol, pas à l'affichage.
   */
  prefetch: (path: string, options?: { data?: boolean }) => void;

  /**
   * Remplace la page courante par une nouvelle sans grossir la pile —
   * comme `Navigator.pushReplacement`. L'ancienne page est démontée (son
   * état est perdu), contrairement à `push`.
   */
  replace: (page: ReactElement) => void;

  /** `true` si `pop()` aura un effet (la pile contient plus d'une page). */
  canPop: boolean;

  /** Profondeur actuelle de la pile (1 = uniquement la page racine). */
  depth: number;
}

interface NavigatorProviderBaseProps {
  /**
   * Si `true` (défaut), synchronise `pop()` avec le bouton "retour" du
   * navigateur/de l'OS : chaque `push` ajoute une entrée d'historique, et
   * un retour navigateur dépile la pile en interne.
   *
   * Avec `routes`, chaque `pushNamed` a sa propre URL (deep-link et refresh
   * possibles). Un `push(<Page />)` garde l'URL de la page du dessous.
   */
  syncWithBrowserHistory?: boolean;
  /** Rendu au-dessus de la pile, dans le contexte du Navigator (ex. dialogs). */
  children?: ReactNode;
}

export type NavigatorProviderProps = NavigatorProviderBaseProps &
  (
    | {
        /** La première page affichée — l'équivalent de `home` dans un `MaterialApp`. */
        initialPage: ReactElement;
        routes?: never;
        initialPath?: never;
        initialData?: never;
        onUnknownRoute?: never;
      }
    | {
        initialPage?: never;
        /** Table de routes nommées (voir `defineRoutes`) — l'équivalent de `routes` dans un `MaterialApp`. */
        routes: Routes;
        /**
         * URL de la première page. Par défaut `window.location.pathname`.
         * À fournir en SSR (Next : `usePathname()`), où `window` n'existe pas.
         */
        initialPath?: string;
        /** Données de la première page (son `static load`), déjà chargées par le serveur. */
        initialData?: unknown;
        /** Page affichée si aucune route ne correspond — comme `onUnknownRoute` en Flutter. */
        onUnknownRoute?: (path: string) => ReactElement;
      }
  );
