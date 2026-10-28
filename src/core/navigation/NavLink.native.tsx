import { createElement, useContext, type ReactNode } from "react";
import { Pressable } from "react-native";
import { useNativeTheme } from "../theme/nativeTheme";
import { DefaultTextStyle, DefaultTextStyleScope, textChild } from "../widgets/basic.native";
import type { PageClass } from "./pageRoutes";
import { useNavigator } from "./Navigator.native";
import type { NavLinkProps } from "./NavLink";

export type { NavLinkProps } from "./NavLink";

/**
 * Lien vers une route nommée. Sur mobile, une zone touchable qui appelle
 * `pushNamed` ; les attributs propres au web (`href`, `style` CSS…) sont ignorés.
 */
export function NavLink<T extends string | PageClass>(props: NavLinkProps<T>) {
  const { to, params, children } = props as { to: string | PageClass; params?: Record<string, string>; children?: ReactNode };
  const nav = useNavigator();
  const colors = useNativeTheme().data.colorScheme;
  const inherited = useContext(DefaultTextStyle);
  const pattern = typeof to === "string" ? to : to.route;

  return createElement(
    Pressable,
    {
      accessibilityRole: "link",
      onPress: () => (nav.pushNamed as (route: string, params?: Record<string, string>) => void)(pattern, params),
    },
    // Texte nu : couleur de lien, sauf si le parent impose une couleur (AppBar…).
    typeof children === "string"
      ? createElement(DefaultTextStyleScope, { style: { color: inherited.color ?? colors.primary } }, textChild(children))
      : textChild(children)
  );
}
