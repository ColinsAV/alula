# @colinsavenue/alula

Écrire une app React comme une app Flutter : des widgets en classes (`StatelessWidget`, `StatefulWidget`), des fonctions de mise en page (`Scaffold`, `Column`, `Row`, `Text`…), un `MaterialApp` comme racine, et une CLI `alula` qui transforme le tout en **site Next.js** (rendu serveur, SEO, sitemap) et en **app mobile Expo** à partir du même code.

Ce n'est pas un moteur de rendu alternatif : sous le capot ce sont des composants React normaux (MUI sur le web, React Native + Paper sur mobile). Les hooks, les DevTools et les composants JSX restent utilisables.

## Démarrer

```bash
npx @colinsavenue/alula create mon-app   # --web (site seul) ou --native (site + mobile)
cd mon-app
npm run dev          # site web (Next.js)
npm run dev:native   # app mobile (Expo Go), si créée avec --native
```

Le projet généré :

```
mon-app/
├── lib/
│   ├── main.tsx            # point d'entrée : runApp(<MaterialApp … />)
│   └── pages/HomePage.tsx  # une page = un widget avec `static route`
├── alula.config.mjs        # config facultative
└── package.json            # scripts : alula dev | build | start
```

Options de `create` : `--from <spec>` (version de la lib : `.tgz`, `github:…`), `--no-install`, `--no-git`.

### Avec un assistant IA

Le paquet contient [`AGENTS.md`](./AGENTS.md), un guide pour les assistants de code (Claude Code, Cursor, Codex, Copilot…). Un projet créé avec `alula create` a déjà un `AGENTS.md` (et un `CLAUDE.md`) qui y renvoie. Pour un projet existant, ajoute ceci à ton `AGENTS.md` :

```md
Avant d'écrire du code, lis `node_modules/@colinsavenue/alula/AGENTS.md`.
```

## Le point d'entrée

```tsx
// lib/main.tsx
import { ChangeNotifierProvider, MaterialApp, runApp, ThemeMode } from "@colinsavenue/alula";
import { CartModel } from "./CartModel";

export default runApp(
  <MaterialApp
    title="Mon app"
    theme={{ colorScheme: { primary: "#4f46e5" } }}
    darkTheme={{ colorScheme: { primary: "#a5b4fc" } }}
    themeMode={ThemeMode.system}
    providers={[ChangeNotifierProvider({ create: () => new CartModel() })]}
  />
);
```

Pas de liste de pages : la CLI trouve toute seule les classes exportées de `lib/` qui déclarent `static route`.

Autres props de `MaterialApp` : `locale` (défaut `"fr"`), `onUnknownRoute`, `siteUrl` (défaut `process.env.SITE_URL`), `sitemapPaths` (URLs de routes à paramètres à mettre dans le sitemap).

## Widgets

### StatelessWidget

```tsx
import { StatelessWidget, Text, Card, Padding, EdgeInsets } from "@colinsavenue/alula";

export class GreetingCard extends StatelessWidget<{ name: string }> {
  build() {
    return Card({
      child: Padding({ padding: EdgeInsets.all(16), child: Text(`Bonjour ${this.props.name}`) }),
    });
  }
}

// Utilisation dans un autre build() :
GreetingCard.new({ name: "Bob" });
```

### StatefulWidget

L'état est porté par des champs de la classe ; `setState` reconstruit le widget.

```tsx
import { StatefulWidget, Row, IconButton, Icon, Icons, Text } from "@colinsavenue/alula";

export class Counter extends StatefulWidget<{}, { initialValue?: number }> {
  private count = 0;

  initState() {
    this.count = this.props.initialValue ?? 0;
  }

  build() {
    return Row({
      spacing: 16,
      children: [
        IconButton({ icon: Icon(Icons.remove), onPressed: () => this.setState(() => { this.count--; }) }),
        Text(this.count),
        IconButton({ icon: Icon(Icons.add), onPressed: () => this.setState(() => { this.count++; }) }),
      ],
    });
  }

  dispose() {
    // nettoyage facultatif (timers, abonnements…)
  }
}
```

| méthode | rôle |
|---|---|
| `initState()` | une fois, à la création (les props sont déjà disponibles) |
| `build()` | à chaque rendu ; on peut y appeler des hooks (`useNavigator()`, `Theme.of()`…) |
| `setState(() => { … })` ou `setState({ … })` | modifie l'état et reconstruit |
| `dispose()` | au démontage |
| `this.props` | toujours à jour, comme `widget` en Flutter |

### Catalogue

Tous exportés depuis `@colinsavenue/alula`, avec la même API qu'en Flutter (props nommées) :

- **Mise en page** : `Container`, `SizedBox`, `Padding`, `Center`, `Align`, `Row`, `Column`, `Expanded`, `Flexible`, `Spacer`, `Wrap`, `Stack`, `Positioned`, `ClipRRect`
- **Base** : `Text`, `Icon` + `Icons`, `Divider`, `Image`
- **Structure** : `Scaffold`, `AppBar`, `Card`, `ListTile`
- **Listes** : `ListView`, `GridView`
- **Saisie / boutons** : `ElevatedButton`, `TextButton`, `OutlinedButton`, `IconButton`, `FloatingActionButton`, `TextField`, `DropdownButton`, `Checkbox`, `Switch`, `Radio`, `Slider`
- **Progression** : `CircularProgressIndicator`, `LinearProgressIndicator`
- **Navigation** : `TabBar`, `BottomNavigationBar`, `NavigationRail`, `IndexedStack`, `TabScaffold`, `NavLink`
- **Pop-up** : `showDialog`, `AlertDialog`, `SimpleDialog`, `showSnackBar`, `showModalBottomSheet`
- **Animations** : `AnimatedContainer`, `AnimatedOpacity`, `AnimatedSwitcher`, `AnimatedCrossFade`, `TweenAnimationBuilder`… et `Curves`
- **Responsive** : `MediaQuery`, `ResponsiveLayout`
- **Async** : `FutureBuilder`
- **Peinture** : `EdgeInsets`, `BorderRadius`, `BoxDecoration`, `LinearGradient`, `Alignment`, `TextStyle`, `FontWeight`…

Seules les icônes écrites `Icons.xxx` dans `lib/` sont embarquées dans le site.

## Pages et navigation

Une page est un widget qui déclare sa route. Les paramètres de l'URL deviennent ses props.

```tsx
export class GreetingPage extends StatelessWidget<{ name: string }> {
  static route = "/greeting/:name";
  static metadata = ({ name }: { name: string }) => ({ title: `Bonjour ${name}` });

  build() {
    const nav = useNavigator();
    return Scaffold({
      appBar: AppBar({ title: Text(`Bonjour ${this.props.name}`) }),
      body: TextButton({ onPressed: nav.canPop ? nav.pop : null, child: "← Retour" }),
    });
  }
}
```

La route doit être une chaîne écrite en dur : la CLI la lit dans le source sans l'exécuter.

`useNavigator()` renvoie l'équivalent de `Navigator.of(context)` :

| API | rôle |
|---|---|
| `nav.pushNamed(GreetingPage, { name: "Bob" })` ou `nav.pushNamed("/greeting/:name", { name: "Bob" })` | ouvre une page avec sa propre URL (paramètres typés) |
| `nav.push(DetailPage, { id: 42 })` ou `nav.push(<Detail />)` | empile une page sans changer l'URL |
| `nav.replace(<Page />)` | remplace la page courante |
| `nav.pop()` | revient en arrière (relié au bouton retour du navigateur) |
| `nav.canPop` / `nav.depth` | état de la pile |
| `nav.prefetch(path)` | précharge le code (et éventuellement les données) d'une page |

`<NavLink to="/blog">` crée un vrai lien, préchargé à l'affichage et au survol.

Les pages de la pile restent montées tant qu'on ne fait pas `pop()` : leur état (formulaire, scroll…) survit à un aller-retour.

### Données chargées sur le serveur

```tsx
async function load({ slug }: { slug: string }) {
  return db.article.find(slug); // null ou undefined → 404
}

export class ArticlePage extends StatelessWidget<{ slug: string; data: Loaded<typeof load> }> {
  static route = "/blog/:slug";
  static load = load;
  static metadata = (_: { slug: string }, article: Loaded<typeof load>) => ({ title: article.title });

  build() {
    return Text(this.props.data.title);
  }
}
```

`static load` tourne toujours sur le serveur (base de données, secrets) : au premier rendu, puis via une Server Action lors des navigations côté client. Le résultat doit être sérialisable en JSON. Pour des données propres à l'utilisateur ou chargées dans le navigateur, utilise `FutureBuilder`.

## État partagé

Comme `ChangeNotifier` + le package `provider` :

```ts
export class CartModel extends ChangeNotifier {
  items: Product[] = [];
  add(product: Product) {
    this.items.push(product);
    this.notifyListeners();
  }
}
```

Fourni dans `MaterialApp({ providers })` (ou localement avec `ChangeNotifierProvider({ create, child })`), puis lu dans `build()` :

| API | rôle |
|---|---|
| `Provider.watch(CartModel)` | l'objet ; reconstruit à chaque `notifyListeners()` |
| `Provider.read(CartModel)` | l'objet, sans écouter (pour les callbacks) |
| `Provider.select(CartModel, (c) => c.items.length)` | reconstruit seulement si la valeur change |

Aussi disponibles : `ValueNotifier`, `ListenableBuilder`, `ValueListenableBuilder`, `MultiProvider`.

## Thème

`theme` / `darkTheme` de `MaterialApp` prennent un `colorScheme`, une police et les styles par composant (`appBarTheme`, `bottomNavigationBarTheme`, `elevatedButtonTheme`…). Dans un `build()` :

```ts
const theme = Theme.of();
Text("Titre", { style: { ...theme.textTheme.titleLarge, color: theme.colorScheme.primary } });
```

`useThemeMode()` et `ThemeModeButton()` permettent de passer en clair, en sombre ou de suivre le système.

## Web et mobile

- **Web** : `alula dev | build | start` génère un projet Next.js (App Router) dans `.alula/`, puis lance `next`. Chaque page a son propre chunk chargé à la demande, ses métadonnées, et elle apparaît dans `sitemap.xml` / `robots.txt`. `public/` et les `.env*` de la racine sont pris en compte.
- **Mobile** : `alula dev --native` génère une app Expo dans `.alula-native/` et lance `expo start` (QR code pour Expo Go, ou `i` / `a` pour un simulateur). Les mêmes pages sont rendues par les fichiers `.native.tsx` de la lib (React Native). Le build mobile n'existe pas encore.

Ces deux dossiers sont générés : il ne faut pas les modifier ni les committer.

### `alula.config.mjs`

```js
export default {
  entry: "lib/main.tsx",   // point d'entrée (défaut)
  next: { /* config Next additionnelle */ },
  revalidate: false,       // durée de cache des pages en secondes, false = jusqu'au prochain build
  native: { name: "Mon app", slug: "mon-app", scheme: "mon-app" },
};
```

## Dépendances

React, Next, MUI et Emotion sont des **peer dependencies** (et Expo, React Native, React Native Paper, React Navigation pour le mobile, en optionnel). `alula create` les ajoute au projet dans les bonnes versions.

## Développer la lib

```bash
npm install
npm run dev          # app de démo (src/examples) sur le web
npm run dev:native   # app de démo sur mobile
npm run test         # vitest
npm run typecheck
npm run build        # dist/ (esm + cjs + .d.ts) via tsup
```

L'app de démo (`src/examples/lib`) montre tous les widgets ; son `alula.config.mjs` utilise `library: ".."` pour importer la lib depuis le source plutôt que depuis le paquet publié.

## Roadmap

- Build de l'app mobile (EAS).
- Plugin ESLint pour faire respecter les conventions des widgets.
