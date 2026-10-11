import { ChangeNotifierProvider, MaterialApp, runApp, ThemeMode } from "../../index";
import { CartModel } from "./features/state/CartModel";

// Pas de liste de pages : la CLI `better` trouve les widgets portant
// `static route` dans lib/ et les charge à la demande.
export default runApp(
  <MaterialApp
    title="better"
    sitemapPaths={["/navigation/greeting/Alice", "/blog/premier-article", "/blog/static-load"]}
    theme={{ colorScheme: { primary: "#4f46e5", secondary: "#db2777" } }}
    darkTheme={{ colorScheme: { primary: "#a5b4fc", secondary: "#f9a8d4" } }}
    themeMode={ThemeMode.system}
    providers={[ChangeNotifierProvider({ create: () => new CartModel() })]}
  />
);
