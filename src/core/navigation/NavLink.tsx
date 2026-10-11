"use client";

import { useEffect, useRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useNavigator } from "./Navigator";
import { buildPath, type RouteParamNames, type RouteParams } from "./routes";
import type { PageClass } from "./pageRoutes";

type NavLinkParams<T> = T extends string
  ? [RouteParamNames<T>] extends [never]
    ? { params?: never }
    : { params: RouteParams<T> }
  : T extends new (props: infer P) => any
    ? {} extends P
      ? { params?: P }
      : { params: P }
    : never;

export type NavLinkProps<T extends string | PageClass> = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  /** La page cible (`GreetingPage`) ou le motif de sa route (`'/greeting/:name'`). */
  to: T;
} & NavLinkParams<T>;

/**
 * Lien vers une route nommée. Rend un vrai `<a href>` (suivi par les moteurs
 * de recherche, ouvrable dans un nouvel onglet) mais, sur un clic simple,
 * empile la page avec `pushNamed` au lieu de recharger. Précharge le code
 * de la page cible dès que le lien est visible, et ses données (`static load`)
 * au survol.
 *
 * ```tsx
 * <NavLink to={GreetingPage} params={{ name: "Bob" }}>Bob</NavLink>
 * <NavLink to="/greeting/:name" params={{ name: "Bob" }}>Bob</NavLink>
 * ```
 */
export function NavLink<T extends string | PageClass>(props: NavLinkProps<T>) {
  const { to, params, onClick, onMouseEnter, onFocus, ...anchorProps } = props as NavLinkProps<string> & {
    to: string | PageClass;
    params?: Record<string, string>;
  };
  const nav = useNavigator();
  const pattern = typeof to === "string" ? to : to.route;
  const href = buildPath(pattern, params);
  const ref = useRef<HTMLAnchorElement>(null);

  // Préchargement quand le lien entre dans l'écran, comme le <Link> de Next.
  useEffect(() => {
    const anchor = ref.current;
    if (!anchor || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        nav.prefetch(href);
        observer.disconnect();
      }
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [nav, href]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    // Laisse le navigateur gérer ctrl/cmd-clic, clic milieu, target="_blank"…
    const isPlainClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      (!anchorProps.target || anchorProps.target === "_self");
    if (!isPlainClick) return;

    event.preventDefault();
    (nav.pushNamed as (route: string, params?: Record<string, string>) => void)(pattern, params);
  }

  return (
    <a
      {...anchorProps}
      ref={ref}
      href={href}
      onClick={handleClick}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        // Au survol : l'utilisateur va probablement cliquer, on charge aussi les données.
        nav.prefetch(href, { data: true });
      }}
      onFocus={(event) => {
        onFocus?.(event);
        nav.prefetch(href, { data: true });
      }}
    />
  );
}
