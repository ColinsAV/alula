import { NavLink, StatelessWidget, Text, TextButton, Theme, useNavigator, type Loaded } from "../../../../index";
import { DemoShell } from "../../shell/DemoShell";
import { getArticle } from "./articles";

// `null` (article inconnu) → vraie page 404, côté serveur comme en navigation.
async function load({ slug }: { slug: string }) {
  return getArticle(slug);
}

type Article = Loaded<typeof load>;

export class ArticlePage extends StatelessWidget<{ slug: string; data: Article }> {
  static route = "/blog/:slug";
  static load = load;
  // Les métadonnées utilisent les données : titre et résumé de l'article
  // dans l'onglet, Google et les aperçus de partage.
  static metadata = (_params: { slug: string }, article: Article) => ({
    title: article.title,
    description: article.summary,
  });

  override build() {
    const theme = Theme.of();
    const nav = useNavigator();
    const article = this.props.data;

    return DemoShell({
      current: "/blog",
      title: article.title,
      description: `Publié le ${article.publishedAt}`,
      children: [
        Text(article.body, { style: theme.textTheme.bodyLarge }),
        // Arrivé directement sur l'article (lien externe) : rien à dépiler.
        nav.canPop ? TextButton({ onPressed: nav.pop, child: "← Retour" }) : <NavLink to="/blog">← Tous les articles</NavLink>,
      ],
    });
  }
}
