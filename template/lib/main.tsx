import { MaterialApp, runApp, ThemeMode } from "@colins/alula";

// Point d'entrée de l'app. Pas de liste de pages : `alula` trouve les
// widgets qui ont un `static route` dans lib/.
export default runApp(
  <MaterialApp
    title="{{title}}"
    theme={{ colorScheme: { primary: "#4f46e5" } }}
    darkTheme={{ colorScheme: { primary: "#a5b4fc" } }}
    themeMode={ThemeMode.system}
  />
);
