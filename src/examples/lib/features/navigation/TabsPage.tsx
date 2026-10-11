import CalculateIcon from "@mui/icons-material/Calculate";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import HomeIcon from "@mui/icons-material/Home";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  AppBar,
  Column,
  CrossAxisAlignment,
  DropdownButton,
  DropdownMenuItem,
  EdgeInsets,
  Icon,
  Padding,
  Provider,
  StatefulWidget,
  TabItem,
  TabPosition,
  TabScaffold,
  Text,
  Theme,
  ThemeModeButton,
  type TabScaffoldProps,
} from "../../../../index";
import { CartModel } from "../state/CartModel";
import { CartTab, ShopTab } from "../state/shop";
import { Counter } from "../state/Counter";

type Choice = TabPosition | "responsive";

const CHOICES: { value: Choice; label: string }[] = [
  { value: "top", label: "En haut (TabBar)" },
  { value: "bottom", label: "En bas (BottomNavigationBar)" },
  { value: "left", label: "À gauche (NavigationRail)" },
  { value: "right", label: "À droite (NavigationRail)" },
  { value: "responsive", label: "Selon l'écran : bas sur mobile, gauche sur desktop" },
];

export class TabsPage extends StatefulWidget {
  static route = "/navigation/tabs";
  static metadata = () => ({
    title: "Onglets",
    description: "TabBar, BottomNavigationBar et NavigationRail, en haut, en bas ou sur les côtés.",
  });

  private choice: Choice = "top";

  override initState() {}

  override build() {
    const theme = Theme.of();
    // Reconstruit la page seulement quand le nombre d'articles change.
    const cartCount = Provider.select(CartModel, (cart) => cart.items.length);
    const position: TabScaffoldProps["position"] =
      this.choice === "responsive" ? { compact: "bottom", expanded: "left" } : this.choice;

    return TabScaffold({
      position,
      appBar: AppBar({ title: Text("Onglets"), actions: [ThemeModeButton()] }),
      tabs: [
        TabItem({
          label: "Accueil",
          icon: Icon(HomeOutlinedIcon),
          activeIcon: Icon(HomeIcon),
          body: Padding({
            padding: EdgeInsets.all(24),
            child: Column({
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 16,
              children: [
                Text("Position de la barre", { style: theme.textTheme.titleMedium }),
                DropdownButton({
                  value: this.choice,
                  isExpanded: true,
                  items: CHOICES.map((c) => DropdownMenuItem({ value: c.value, child: Text(c.label) })),
                  onChanged: (choice) => this.setState(() => { this.choice = choice; }),
                }),
                Text(
                  "Changez la valeur du compteur, changez de position ou d'onglet : il garde sa valeur.",
                  { style: { color: theme.colorScheme.onSurfaceVariant } }
                ),
              ],
            }),
          }),
        }),
        TabItem({
          label: "Compteur",
          icon: Icon(CalculateOutlinedIcon),
          activeIcon: Icon(CalculateIcon),
          body: Padding({ padding: EdgeInsets.all(24), child: Counter.new() }),
        }),
        TabItem({
          label: "Boutique",
          icon: Icon(StorefrontOutlinedIcon),
          activeIcon: Icon(StorefrontIcon),
          body: ShopTab.new(),
        }),
        TabItem({
          label: cartCount > 0 ? `Panier (${cartCount})` : "Panier",
          icon: Icon(ShoppingCartOutlinedIcon),
          activeIcon: Icon(ShoppingCartIcon),
          body: CartTab.new(),
        }),
      ],
    });
  }
}
