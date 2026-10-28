import {
  Alignment,
  BorderRadius,
  BoxDecoration,
  Column,
  Container,
  CrossAxisAlignment,
  Divider,
  DropdownButton,
  DropdownMenuItem,
  EdgeInsets,
  Expanded,
  GridView,
  Icon,
  Icons,
  InputDecoration,
  ListTile,
  ListView,
  MediaQuery,
  Row,
  SizedBox,
  StatefulWidget,
  Text,
  TextField,
  Theme,
} from "../../../../index";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

type Category = "Tous" | "Fruits" | "Légumes";
const CATEGORIES: Category[] = ["Tous", "Fruits", "Légumes"];

const PRODUCTS = Array.from({ length: 10_000 }, (_, i) => ({
  name: `${i % 2 === 0 ? "Pomme" : "Carotte"} n°${i + 1}`,
  category: (i % 2 === 0 ? "Fruits" : "Légumes") as Category,
}));

export class ListsPage extends StatefulWidget {
  static route = "/lists";
  static metadata = () => ({
    title: "Listes",
    description: "ListView.builder virtualisé sur 10 000 éléments, ListView.separated, GridView responsive.",
  });

  private search = "";
  private category: Category = "Tous";

  override initState() {}

  override build() {
    const colors = Theme.of().colorScheme;
    const columns = { compact: 2, medium: 3, expanded: 4 }[MediaQuery.of().windowSizeClass];

    const query = this.search.toLowerCase();
    const products = PRODUCTS.filter(
      (p) => (this.category === "Tous" || p.category === this.category) && p.name.toLowerCase().includes(query)
    );

    return DemoShell({
      current: ListsPage.route,
      title: "Listes",
      description: "Des listes et grilles qui défilent, construites élément par élément.",
      children: [
        DemoSection({
          title: `ListView.builder — ${products.length.toLocaleString("fr")} produits`,
          description: "Avec itemExtent, seuls les éléments visibles sont rendus : 10 000 lignes restent fluides.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Row({
                spacing: 12,
                children: [
                  Expanded({
                    child: TextField({
                      value: this.search,
                      onChanged: (value) => this.setState(() => { this.search = value; }),
                      decoration: InputDecoration({
                        labelText: "Rechercher",
                        prefixIcon: Icon(Icons.search, { color: colors.onSurfaceVariant }),
                      }),
                    }),
                  }),
                  SizedBox({
                    width: 160,
                    child: DropdownButton({
                      labelText: "Catégorie",
                      value: this.category,
                      isExpanded: true,
                      items: CATEGORIES.map((c) => DropdownMenuItem({ value: c, child: Text(c) })),
                      onChanged: (c) => this.setState(() => { this.category = c; }),
                    }),
                  }),
                ],
              }),
              Container({
                height: 320,
                decoration: BoxDecoration({ color: colors.surfaceContainer, borderRadius: BorderRadius.circular(8) }),
                child: ListView.builder({
                  itemCount: products.length,
                  itemExtent: 48,
                  itemBuilder: (i) =>
                    Container({
                      height: 48,
                      padding: EdgeInsets.symmetric({ horizontal: 16 }),
                      alignment: Alignment.centerLeft,
                      child: Text(`${products[i]!.name} — ${products[i]!.category}`),
                    }),
                }),
              }),
            ],
          }),
        }),

        DemoSection({
          title: "ListView.separated",
          description: "Un séparateur entre chaque élément.",
          child: ListView.separated({
            shrinkWrap: true,
            itemCount: 4,
            itemBuilder: (i) => ListTile({ title: `Élément ${i + 1}`, subtitle: "Sous-titre" }),
            separatorBuilder: () => Divider(),
          }),
        }),

        DemoSection({
          title: `GridView.count — ${columns} colonnes`,
          description: "Le nombre de colonnes suit la largeur de l'écran (MediaQuery).",
          child: GridView.count({
            crossAxisCount: columns,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            shrinkWrap: true,
            children: Array.from({ length: 8 }, (_, i) =>
              Container({
                alignment: Alignment.center,
                height: Infinity,
                decoration: BoxDecoration({
                  color: `hsl(${i * 45}, 70%, 85%)`,
                  borderRadius: BorderRadius.circular(8),
                }),
                child: Text(`Case ${i + 1}`, { style: { color: "#1f2937" } }),
              })
            ),
          }),
        }),
      ],
    });
  }
}
