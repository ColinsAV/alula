import {
  Card,
  Column,
  CrossAxisAlignment,
  EdgeInsets,
  NavLink,
  Padding,
  StatelessWidget,
  Text,
  Theme,
  type Loaded,
} from "../../../../index";
import { DemoShell } from "../../shell/DemoShell";
import { getArticles } from "./articles";

// Exécuté sur le serveur : au rendu de /blog, ou par une Server Action
// quand on y arrive en naviguant dans le site.
async function load() {
  return getArticles();
}

export class BlogPage extends StatelessWidget<{ data: Loaded<typeof load> }> {
  static route = "/blog";
  static load = load;
  static metadata = () => ({
    title: "Blog",
    description: "Articles chargés côté serveur avec static load.",
  });

  override build() {
    const theme = Theme.of();

    return DemoShell({
      current: BlogPage.route,
      title: "Blog",
      description: "Les articles sont chargés sur le serveur (static load) : affichez le code source de la page, ils y sont.",
      children: this.props.data.map((article) =>
        Card({
          child: Padding({
            padding: EdgeInsets.all(20),
            child: Column({
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 6,
              children: [
                <NavLink to="/blog/:slug" params={{ slug: article.slug }} style={{ color: "inherit" }}>
                  {Text(article.title, { style: theme.textTheme.titleLarge })}
                </NavLink>,
                Text(article.summary, { style: { color: theme.colorScheme.onSurfaceVariant } }),
                Text(article.publishedAt, { style: { ...theme.textTheme.labelSmall, color: theme.colorScheme.onSurfaceVariant } }),
              ],
            }),
          }),
        })
      ),
    });
  }
}
