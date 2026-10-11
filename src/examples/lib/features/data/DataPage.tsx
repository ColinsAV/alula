import { Column, CrossAxisAlignment, NavLink, StatelessWidget, Text } from "../../../../index";
import { CodeBlock } from "../../shell/CodeBlock";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";
import { QuoteCard } from "./QuoteCard";

export class DataPage extends StatelessWidget {
  static route = "/data";
  static metadata = () => ({
    title: "Données",
    description: "FutureBuilder pour les données chargées dans le navigateur, static load pour le serveur.",
  });

  override build() {
    return DemoShell({
      current: DataPage.route,
      title: "Données",
      description: "Deux façons de charger des données, selon qu'elles doivent être vues par Google ou non.",
      children: [
        DemoSection({
          title: "FutureBuilder — dans le navigateur",
          description:
            "Pour ce qui est interactif ou propre à l'utilisateur. Appel simulé : 1 s d'attente, une erreur une fois sur quatre.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              QuoteCard.new(),
              CodeBlock({
                code: `FutureBuilder({
  future: this.quote, // créée dans initState, pas dans build()
  builder: (snapshot) => {
    if (snapshot.hasError) return Text("Erreur");
    if (!snapshot.hasData) return CircularProgressIndicator();
    return Text(snapshot.data!.text);
  },
})`,
              }),
            ],
          }),
        }),

        DemoSection({
          title: "static load — sur le serveur",
          description:
            "Pour le contenu de la page : il arrive dans le HTML (SEO, aperçus de partage), null donne une vraie 404.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              CodeBlock({
                code: `async function load({ slug }: { slug: string }) {
  return getArticle(slug); // null → 404
}

class ArticlePage extends StatelessWidget<{ slug: string; data: Loaded<typeof load> }> {
  static route = "/blog/:slug";
  static load = load;
  static metadata = (_, article) => ({ title: article.title });

  build() { return Text(this.props.data.title); }
}`,
              }),
              Text("Voir le résultat :"),
              <NavLink to="/blog">Le blog de démo →</NavLink>,
            ],
          }),
        }),
      ],
    });
  }
}
