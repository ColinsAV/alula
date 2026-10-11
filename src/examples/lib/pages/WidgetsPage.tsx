import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
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
  ElevatedButton,
  Expanded,
  FontWeight,
  Icon,
  IconButton,
  InputDecoration,
  ListView,
  MainAxisAlignment,
  MainAxisSize,
  OutlinedButton,
  Row,
  SizedBox,
  StatefulWidget,
  Text,
  TextButton,
  TextField,
  Theme,
  Wrap,
  type ColorScheme,
} from "../../../index";

type Category = "Tous" | "Fruits" | "Légumes";
const CATEGORIES: Category[] = ["Tous", "Fruits", "Légumes"];

const PRODUCTS = Array.from({ length: 20 }, (_, i) => ({
  name: `${i % 2 === 0 ? "Pomme" : "Carotte"} n°${i + 1}`,
  category: (i % 2 === 0 ? "Fruits" : "Légumes") as Category,
}));

const sectionTitle = (text: string) =>
  Text(text, { style: { fontSize: 16, fontWeight: FontWeight.w600 } });

/** Petite boîte colorée pour visualiser les alignements. */
const box = (colors: ColorScheme, label: string) =>
  Container({
    width: 48,
    height: 32,
    alignment: Alignment.center,
    decoration: BoxDecoration({ color: colors.primary, borderRadius: BorderRadius.circular(6) }),
    child: Text(label, { style: { color: colors.onPrimary } }),
  });

const alignmentRow = (colors: ColorScheme, alignment: MainAxisAlignment) =>
  Column({
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 4,
    children: [
      Text(`MainAxisAlignment.${alignment}`, { style: { fontSize: 12, color: colors.onSurfaceVariant } }),
      Container({
        padding: EdgeInsets.all(4),
        decoration: BoxDecoration({ color: colors.surfaceContainer, borderRadius: BorderRadius.circular(8) }),
        child: Row({
          mainAxisAlignment: alignment,
          spacing: 4,
          children: [box(colors, "A"), box(colors, "B"), box(colors, "C")],
        }),
      }),
    ],
  });

export class WidgetsPage extends StatefulWidget {
  static route = "/widgets";
  static metadata = () => ({
    title: "Catalogue de widgets",
    description: "Container, Row, Column, ListView.builder, boutons, TextField, DropdownButton…",
  });

  private search = "";
  private category: Category = "Tous";
  private count = 0;

  override initState() {}

  override build() {
    const colors = Theme.of().colorScheme;
    const query = this.search.toLowerCase();
    const products = PRODUCTS.filter(
      (p) =>
        (this.category === "Tous" || p.category === this.category) &&
        p.name.toLowerCase().includes(query)
    );

    return Container({
      height: "100vh",
      padding: EdgeInsets.all(24),
      child: Column({
        mainAxisSize: MainAxisSize.max,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          sectionTitle("Alignements (Row)"),
          alignmentRow(colors, MainAxisAlignment.start),
          alignmentRow(colors, MainAxisAlignment.center),
          alignmentRow(colors, MainAxisAlignment.end),
          alignmentRow(colors, MainAxisAlignment.spaceBetween),

          sectionTitle("Boutons"),
          Wrap({
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton({
                onPressed: () => this.setState(() => { this.count++; }),
                child: `Cliqué ${this.count} fois`,
              }),
              ElevatedButton.icon({
                onPressed: () => this.setState(() => { this.count = 0; }),
                icon: Icon(DeleteIcon),
                label: "Remettre à zéro",
              }),
              OutlinedButton({ onPressed: () => {}, child: "Outlined" }),
              TextButton({ onPressed: () => {}, child: "Text" }),
              ElevatedButton({ onPressed: null, child: "Désactivé" }),
              IconButton({
                icon: Icon(AddIcon),
                tooltip: "Ajouter 10",
                onPressed: () => this.setState(() => { this.count += 10; }),
              }),
            ],
          }),

          sectionTitle(`ListView.builder — ${products.length} produits (seuls les visibles sont rendus)`),
          Row({
            spacing: 12,
            children: [
              Expanded({
                child: TextField({
                  value: this.search,
                  onChanged: (value) => this.setState(() => { this.search = value; }),
                  decoration: InputDecoration({
                    labelText: "Rechercher",
                    prefixIcon: Icon(SearchIcon, { color: colors.onSurfaceVariant }),
                  }),
                }),
              }),
              SizedBox({
                width: 180,
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
          Expanded({
            child: Container({
              height: Infinity, // remplit l'Expanded : la liste défile dedans
              decoration: BoxDecoration({ color: colors.surfaceContainer, borderRadius: BorderRadius.circular(8) }),
              child: ListView.builder({
                itemCount: products.length,
                itemExtent: 48,
                itemBuilder: (i) =>
                  Column({
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container({
                        height: 47,
                        padding: EdgeInsets.symmetric({ horizontal: 16 }),
                        alignment: Alignment.centerLeft,
                        child: Text(`${products[i]!.name} — ${products[i]!.category}`),
                      }),
                      Divider({ height: 1 }),
                    ],
                  }),
              }),
            }),
          }),
        ],
      }),
    });
  }
}
