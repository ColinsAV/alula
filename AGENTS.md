# @colinsavenue/alula — guide pour les agents IA

Ce fichier explique aux assistants de code comment écrire une app avec `@colinsavenue/alula`. Il est livré avec le paquet : `node_modules/@colinsavenue/alula/AGENTS.md`.

alula reproduit l'API de Flutter en React. **Écris le code comme en Flutter (en TypeScript), pas comme en React classique.** Avant d'inventer une API, cherche l'équivalent Flutter : c'est presque toujours le même nom avec les mêmes props nommées. Les types (`node_modules/@colinsavenue/alula/dist/index.d.ts`) et leur JSDoc font foi.

## Structure d'un projet

```
lib/main.tsx         # export default runApp(<MaterialApp … />)
lib/**/*.tsx         # widgets et pages
alula.config.mjs     # config facultative (entry, next, revalidate, native)
public/              # fichiers statiques
.alula/              # GÉNÉRÉ (projet Next) : ne jamais modifier
.alula-native/       # GÉNÉRÉ (projet Expo) : ne jamais modifier
```

Commandes : `npm run dev` (web), `npm run dev:native` (mobile, Expo Go), `npm run build`, `npm run start`, `npm run typecheck`.

Il n'y a **pas** de dossier `app/` ni de `next.config.*` à écrire : la CLI `alula` les génère dans `.alula/` à partir de `lib/`. Pour une option Next, passe par `next` dans `alula.config.mjs`.

## Règles essentielles

1. **Un widget est une classe.** `StatelessWidget<Props>` ou `StatefulWidget<State, Props>`. Attention à l'ordre des génériques : pour `StatefulWidget`, l'état vient **avant** les props (souvent `StatefulWidget<{}, Props>`, avec l'état porté par des champs).
2. **`build()` renvoie un arbre de widgets construit par appels de fonctions**, pas du JSX : `Column({ children: [Text("a"), Text("b")] })`. Le JSX reste possible ponctuellement (ex. `<NavLink to="/blog">…</NavLink>`), mais n'écris pas de `<div>` ni de CSS : sur mobile, tout est rendu en React Native.
3. **Utiliser un widget maison** : `MonWidget.new({ ...props })` (comme le `new` facultatif de Dart). Jamais `new MonWidget(...)` ni `<MonWidget />`.
4. **`StatefulWidget`** :
   - `initState()` est **obligatoire** (abstraite) ; écris `override initState() {}` s'il n'y a rien à initialiser.
   - L'état = des champs privés de la classe. On le modifie dans `this.setState(() => { this.count++; })` (ou `this.setState({ … })`). Modifier un champ sans `setState` ne reconstruit rien.
   - Les `Future` (pour `FutureBuilder`) se créent dans `initState`, jamais dans `build()`.
   - `dispose()` (facultatif) pour arrêter timers et abonnements.
   - `this.props` est toujours à jour.
5. **Hooks** : uniquement dans `build()`, au début et sans condition (`useNavigator()`, `Theme.of()`, `Provider.watch(...)`, `MediaQuery…`). Jamais dans `initState`, un constructeur ou un callback.
6. **`Text` ne prend qu'une chaîne ou un nombre** : `Text(value, { style, textAlign, maxLines, overflow })`. Les props `child` des boutons acceptent aussi une chaîne : `TextButton({ child: "OK", onPressed })`. Un bouton désactivé = `onPressed: null`.
7. **Icônes** : toujours `Icon(Icons.nom_material)` écrit en toutes lettres (ex. `Icons.arrow_back`). La CLI ne lit que ces occurrences littérales pour savoir quelles icônes embarquer : `Icons[variable]` ne marchera pas.

## Pages et routes

Une page est une classe **exportée**, dans `lib/`, avec `static route`. Elle est trouvée automatiquement (ne pas la lister dans `MaterialApp`).

```tsx
import { AppBar, Scaffold, StatelessWidget, Text, TextButton, useNavigator } from "@colinsavenue/alula";

type Props = { name: string };

export class GreetingPage extends StatelessWidget<Props> {
  static route = "/greeting/:name"; // chaîne littérale obligatoire (lue sans exécuter le code)
  static metadata = ({ name }: Props) => ({ title: `Bonjour ${name}`, description: "…" });

  override build() {
    const nav = useNavigator();
    return Scaffold({
      appBar: AppBar({ title: Text(`Bonjour ${this.props.name}`) }),
      body: TextButton({ onPressed: nav.canPop ? nav.pop : null, child: "← Retour" }),
    });
  }
}
```

- Les paramètres `:xxx` deviennent des props (chaînes).
- Une seule page par route ; `"/"` = accueil.
- Navigation : `nav.pushNamed(GreetingPage, { name: "Bob" })` (nouvelle URL, à préférer pour une page), `nav.push(Widget, props)` (empile sans changer l'URL), `nav.replace(...)`, `nav.pop()`, `nav.canPop`. Lien : `<NavLink to="/greeting/Bob">`.
- Pour qu'une URL à paramètres apparaisse dans le sitemap : `sitemapPaths` de `MaterialApp`.

### Données serveur : `static load`

```tsx
async function load({ slug }: { slug: string }) {
  return db.article.find(slug); // null / undefined → 404
}

export class ArticlePage extends StatelessWidget<{ slug: string; data: Loaded<typeof load> }> {
  static route = "/blog/:slug";
  static load = load;
  static metadata = (_: { slug: string }, article: Loaded<typeof load>) => ({ title: article.title });
  override build() {
    return Text(this.props.data.title);
  }
}
```

- `load` s'exécute **toujours sur le serveur** (secrets et base de données autorisés) ; le résultat doit être sérialisable en JSON et arrive dans `props.data`.
- Contenu à indexer (SEO) → `static load`. Données propres à l'utilisateur ou interactives → `FutureBuilder` dans le navigateur.

## État partagé

```ts
export class CartModel extends ChangeNotifier {
  items: Product[] = [];
  add(p: Product) {
    this.items.push(p);
    this.notifyListeners(); // obligatoire après chaque modification
  }
}
```

- Fourni pour toute l'app : `MaterialApp({ providers: [ChangeNotifierProvider({ create: () => new CartModel() })] })` dans `lib/main.tsx`. Localement : `ChangeNotifierProvider({ create, child })`.
- Lecture dans `build()` : `Provider.watch(CartModel)` (reconstruit), `Provider.read(CartModel)` (pour les callbacks, ne reconstruit pas), `Provider.select(CartModel, (c) => c.items.length)`.
- Sans provider : `ValueNotifier` + `ValueListenableBuilder`, `ListenableBuilder`.

## Thème

- Défini dans `MaterialApp` : `theme`, `darkTheme` (`colorScheme`, `fontFamily`, `appBarTheme`, `elevatedButtonTheme`…), `themeMode={ThemeMode.system}`.
- Dans `build()` : `const theme = Theme.of();` puis `theme.colorScheme.primary`, `theme.textTheme.titleLarge`… Ne code pas de couleurs en dur.
- Bascule clair/sombre : `ThemeModeButton()` ou `useThemeMode()`.

## Widgets disponibles

Tous importés depuis `@colinsavenue/alula` :

- Mise en page : `Container`, `SizedBox`, `Padding`, `Center`, `Align`, `Row`, `Column` (avec `spacing`), `Expanded`, `Flexible`, `Spacer`, `Wrap`, `Stack`, `Positioned`, `ClipRRect`
- Base : `Text`, `Icon`, `Icons`, `Divider`, `Image.asset(import)`, `Image.network(url)`
- Structure : `Scaffold`, `AppBar`, `Card`, `ListTile`
- Listes : `ListView`, `GridView`
- Saisie : `ElevatedButton`, `TextButton`, `OutlinedButton`, `IconButton`, `FloatingActionButton`, `TextField`, `DropdownButton`, `Checkbox`, `Switch`, `Radio`, `Slider`
- Progression : `CircularProgressIndicator`, `LinearProgressIndicator`
- Navigation : `TabBar`, `BottomNavigationBar`, `NavigationRail`, `IndexedStack`, `TabScaffold`, `NavLink`
- Pop-up : `showDialog({ builder })` (renvoie une `Promise`), `AlertDialog`, `SimpleDialog`, `showSnackBar(...)`, `showModalBottomSheet(...)`
- Animations : `AnimatedContainer`, `AnimatedOpacity`, `AnimatedSwitcher`, `AnimatedCrossFade`, `AnimatedSize`, `TweenAnimationBuilder`, `Curves`
- Responsive : `MediaQuery`, `ResponsiveLayout`
- Async : `FutureBuilder`, `ConnectionState`
- Valeurs : `EdgeInsets`, `BorderRadius`, `Border`, `BoxDecoration`, `LinearGradient`, `RadialGradient`, `Alignment`, `MainAxisAlignment`, `CrossAxisAlignment`, `TextStyle`, `FontWeight`, `BoxFit`

Si un widget Flutter manque, compose-le à partir de ceux-ci plutôt que d'écrire du HTML/CSS ou du React Native directement.

## Images

`import hero from "./hero.jpg"` puis `Image.asset(hero)` (optimisée par `next/image`). Pour une URL distante : `Image.network(url, { width })`.

## À éviter

- Modifier `.alula/` ou `.alula-native/`, ou créer un `app/` Next à la main.
- Écrire des composants fonctionnels React avec `useState` / `useEffect` à la place d'un `StatefulWidget`.
- Construire la route dynamiquement (`static route = PREFIX + "/x"`) ou mettre une page dans une classe non exportée.
- Appeler des hooks hors de `build()`.
- Importer depuis `@colinsavenue/alula/dist/...` : tout s'importe depuis `@colinsavenue/alula`.

## Vérifier son travail

`npm run typecheck`, puis `npm run dev` et ouvrir la page concernée. En cas de doute sur une API, lis le `.d.ts` du widget dans `node_modules/@colinsavenue/alula/dist/core/widgets/`.
