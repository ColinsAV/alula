# @colins/widgets

*(nom de placeholder — renomme-le comme tu veux avant de publier : `sed -i '' 's/@colins\/widgets/@ton-scope\/ton-nom/' package.json`)*

Une DX façon Flutter pour React : composants à **contrat explicite** (props/état déclarés au même endroit, pas éparpillés en hooks), **état encapsulé** qui se fusionne au lieu de s'écraser, et un cycle de vie nommé plutôt que des `useEffect` anonymes.

Ce n'est pas un moteur de rendu alternatif — c'est une couche fine par-dessus les hooks React (donc 100% compatible DevTools, Suspense, concurrent mode, etc.), qui change juste la façon dont tu **écris** un composant.

## L'idée

Au lieu de ça :

```tsx
function Counter({ step = 1 }: { step?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("monté");
    return () => console.log("démonté");
  }, []);

  return <button onClick={() => setCount((c) => c + step)}>{count}</button>;
}
```

Tu écris ça — même résultat, mais un seul contrat explicite (comme un `StatefulWidget` Flutter) :

```tsx
import { defineComponent } from "@colins/widgets";

interface Props { step?: number }
interface State { count: number }

const Counter = defineComponent<Props, State>({
  name: "Counter",
  initialState: () => ({ count: 0 }),
  onMount: () => {
    console.log("monté");
    return () => console.log("démonté");
  },
  build: (ctx) => (
    <button onClick={() => ctx.setState((s) => ({ count: s.count + (ctx.props.step ?? 1) }))}>
      {ctx.state.count}
    </button>
  ),
});
```

## API (lot 1 : le core)

`defineComponent<Props, State>(config)` renvoie un composant React normal. `config` :

| champ | rôle | équivalent Flutter |
|---|---|---|
| `name` | nom affiché dans React DevTools | — |
| `initialState(props)` | calcule l'état initial, une seule fois | `createState` + `initState` |
| `build(ctx)` | rend le JSX, appelé à chaque rendu | `build(context)` |
| `onMount(ctx)` | une fois après le 1er rendu ; le retour (fonction) sert de nettoyage au démontage | `initState` + `dispose` |
| `onUpdate(prevProps, ctx)` | après chaque rendu où les props ont changé (comparaison superficielle) | `didUpdateWidget` |

`ctx` (le `BuildContext`) porte `props`, `state` (lecture seule) et `setState` — qui **fusionne** un objet partiel (ou le retour d'une fonction `(prevState) => partial`) au lieu de remplacer l'état, comme le `setState` de Flutter plutôt que le setter brut de `useState`.

Voir [`examples/counter.tsx`](./examples/counter.tsx) pour un exemple complet.

## Navigation (pages = composants, données passées comme un widget)

`NavigatorProvider` + `useNavigator()` : une pile de pages en mémoire façon `Navigator` Flutter. Une "page" n'est qu'un composant — souvent défini avec `defineComponent`, mais ce n'est pas obligatoire — et on lui passe ses données directement comme à n'importe quel composant, en construisant l'élément :

```tsx
import { NavigatorProvider, useNavigator, defineComponent } from "@colins/widgets";

interface Article { id: string; title: string; body: string }

const DetailPage = defineComponent<{ article: Article }, Record<string, never>>({
  name: "DetailPage",
  build: (ctx) => {
    const nav = useNavigator();
    return (
      <div>
        <button onClick={() => nav.pop()}>← Retour</button>
        <h1>{ctx.props.article.title}</h1>
        <p>{ctx.props.article.body}</p>
      </div>
    );
  },
});

const ListPage = defineComponent<Record<string, never>, Record<string, never>>({
  name: "ListPage",
  build: () => {
    const nav = useNavigator();
    return (
      <button onClick={() => nav.push(<DetailPage article={someArticle} />)}>
        Voir l'article
      </button>
    );
  },
});

export const App = () => <NavigatorProvider initialPage={<ListPage />} />;
```

C'est exactement `Navigator.push(context, MaterialPageRoute(builder: (_) => DetailPage(article: someArticle)))` en Flutter — sauf qu'ici le typage vient gratuitement du JSX/TSX : pas de table de routes en string, pas de `params` non typés à valider à la main.

| API | rôle | équivalent Flutter |
|---|---|---|
| `<NavigatorProvider initialPage={...} />` | conteneur de la pile de pages | `MaterialApp(home: ...)` + `Navigator` implicite |
| `nav.push(<Page {...props} />)` | empile une nouvelle page (typée par le JSX) | `Navigator.push` |
| `nav.pop()` | dépile, révèle la page du dessous (qui n'a jamais été démontée) | `Navigator.pop` |
| `nav.replace(<Page {...props} />)` | remplace la page du dessus (l'ancienne est démontée) | `Navigator.pushReplacement` |
| `nav.canPop` / `nav.depth` | état de la pile | `Navigator.canPop` |

Point important, hérité de Flutter : **toutes les pages de la pile restent montées** (juste cachées) tant qu'on ne fait pas `pop()` — donc l'état encapsulé d'une page (un compteur, un formulaire en cours, une position de scroll) survit quand on navigue ailleurs puis qu'on revient. Voir [`examples/navigation-demo.tsx`](./examples/navigation-demo.tsx) et les tests dans `src/navigation/Navigator.test.tsx` (dont un qui vérifie exactement ça).

Par défaut (`syncWithBrowserHistory: true`), `pop()` est aussi relié au bouton "retour" du navigateur. **Limite volontaire du v1** : c'est un empilement en mémoire, pas un routeur à base d'URL — pas de deep-link direct vers une page poussée, pas d'URL distincte par page. Si tu as besoin de ça, c'est un lot à part (mapper des URLs vers des pages), à discuter séparément.

## Le shell (thème, layout, onglets)

Le pendant de `MaterialApp(theme: ThemeData(colorScheme: ColorScheme.fromSeed(...)))` + `Scaffold(appBar:, body:, bottomNavigationBar:)` + `IndexedStack` : construit sur [MUI](https://mui.com/) (donc compatible avec tous ses composants), mais avec un vocabulaire Flutter plutôt que l'API MUI brute.

```tsx
import {
  AppBar,
  BottomNavigationBar,
  defineComponent,
  IndexedStack,
  Scaffold,
  ThemeProvider,
} from "@colins/better";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const theme = {
  colorScheme: {
    primary: "#1B5E20",
    onPrimary: "#FFFFFF",
    secondary: "#FFD700",
    onSecondary: "#000000",
  },
  bottomNavigationBarTheme: {
    selectedItemColor: "#1B5E20",
    unselectedItemColor: "#9E9E9E",
    selectedLabelBold: true,
  },
};

interface NavPageState {
  currentIndex: number;
}

const NavPage = defineComponent<Record<string, never>, NavPageState>({
  name: "NavPage",
  initialState: () => ({ currentIndex: 0 }),
  build: (ctx) => (
    <Scaffold
      appBar={<AppBar title="Accueil" centerTitle />}
      body={
        <IndexedStack index={ctx.state.currentIndex}>
          <HomePage />
          <CalendarPage />
        </IndexedStack>
      }
      bottomNavigationBar={
        <BottomNavigationBar
          currentIndex={ctx.state.currentIndex}
          onTap={(index) => ctx.setState({ currentIndex: index })}
          items={[
            { icon: <HomeIcon />, label: "Accueil" },
            { icon: <CalendarMonthIcon />, label: "Calendrier" },
          ]}
        />
      }
    />
  ),
});

export const App = () => (
  <ThemeProvider theme={theme}>
    <NavPage />
  </ThemeProvider>
);
```

Voir [`examples/nav-shell-demo.tsx`](./examples/nav-shell-demo.tsx) pour la traduction complète d'une vraie app Flutter à onglets (thème, `AppBar`, `IndexedStack`, `BottomNavigationBar`).

| API | rôle | équivalent Flutter |
|---|---|---|
| `<ThemeProvider theme={...} />` | thème global (couleurs, styles des composants) | `MaterialApp(theme: ThemeData(...))` |
| `theme.colorScheme` | couleurs nommées par rôle (`primary`/`onPrimary`/...) | `ColorScheme.fromSeed(...)` |
| `theme.appBarTheme` / `bottomNavigationBarTheme` / `elevatedButtonTheme` | styles par type de composant | `AppBarTheme` / `BottomNavigationBarThemeData` / `ElevatedButtonThemeData` |
| `<Scaffold appBar={} body={} bottomNavigationBar={} />` | structure de page standard | `Scaffold(appBar:, body:, bottomNavigationBar:)` |
| `<AppBar title={} centerTitle actions={} />` | barre du haut | `AppBar(title:, centerTitle:, actions:)` |
| `<IndexedStack index={} />` | garde tous les enfants montés, affiche un seul | `IndexedStack(index:, children:)` |
| `<BottomNavigationBar currentIndex={} onTap={} items={} />` | barre d'onglets du bas | `BottomNavigationBar(currentIndex:, onTap:, items:)` |

`@mui/material`, `@mui/icons-material`, `@emotion/react` et `@emotion/styled` sont des **peer dependencies** : installe-les dans ton app (`npm install @mui/material @emotion/react @emotion/styled @mui/icons-material`), la lib ne les embarque pas dans son build.

### Câblage Next.js (App Router)

Une "page" `better` est un composant normal — le point de branchement avec le App Router de Next.js, c'est `app/layout.tsx` (thème) et `app/page.tsx` (la page elle-même) :

```tsx
// app/layout.tsx
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@colins/better";
import { theme } from "./theme";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx
import { NavPage } from "./NavPage";

export default function Page() {
  return <NavPage />;
}
```

`app/page.tsx` ne contient jamais de markup — juste le rendu d'un widget défini avec `defineComponent`, écrit dans son propre fichier comme `HomePage`/`DetailPage` dans les exemples ci-dessus. `AppRouterCacheProvider` (fourni par `@mui/material-nextjs`) est nécessaire pour que le CSS-in-JS d'Emotion s'hydrate correctement en SSR streaming — sans lui, le style "flashe" au premier rendu client.

**Limite actuelle, héritée de `NavigatorProvider`** : `IndexedStack` (onglets) et le `NavigatorProvider` (pile push/pop) restent tous les deux 100% client — aucun des deux n'a d'URL propre. Pour une page qui doit être accessible par une URL directe et server-render au refresh, utilise une vraie route Next.js (`app/calendrier/page.tsx`) plutôt que `push()`/`IndexedStack`. Le routeur à base d'URL (mapper des `push()` à de vraies routes) reste un lot à part, cf. roadmap.

## Développement

```bash
npm install
npm run test        # vitest, une fois
npm run test:watch  # vitest en watch
npm run typecheck
npm run build        # génère dist/ (esm + cjs + .d.ts) via tsup
```

## Fait

- **Core** — `defineComponent` (contrat explicite, état encapsulé et fusionné, cycle de vie nommé).
- **Navigation** — `NavigatorProvider` / `useNavigator` (pile de pages en mémoire, état préservé, sync bouton retour).
- **Shell** — `ThemeProvider`, `Scaffold`, `AppBar`, `IndexedStack`, `BottomNavigationBar` (au-dessus de MUI, vocabulaire Flutter).

## Roadmap (pas encore commencés)

- **State management partagé** — façon Riverpod/Provider, pour partager de l'état entre composants sans prop-drilling.
- **Plugin ESLint** — pour faire respecter le contrat (ex: interdire les hooks bruts à l'intérieur de `build`, forcer `name` unique, etc.).
- **Compat Next.js Server Components** — un `build` qui reste utilisable côté serveur quand le composant n'a pas d'état.
- **Routeur à base d'URL** (si besoin) — mapper des URLs à des pages / deep-linking, par-dessus ou à la place de `NavigatorProvider`.
