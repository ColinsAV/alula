import { useNativeTheme } from "./nativeTheme";
import type { ThemeData } from "./themeData";

export type { ColorScheme, TextTheme, ThemeData } from "./themeData";

/** Le thème de l'app, depuis `build()` — comme `Theme.of(context)` en Flutter. */
export const Theme = {
  of(): ThemeData {
    return useNativeTheme().data;
  },
};
