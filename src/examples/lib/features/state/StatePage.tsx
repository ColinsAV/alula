import { Column, CrossAxisAlignment, Expanded, Provider, ResponsiveLayout, Row, StatelessWidget, Text, Theme } from "../../../../index";
import { CodeBlock } from "../../shell/CodeBlock";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";
import { CartModel } from "./CartModel";
import { Counter } from "./Counter";
import { CartTab, ShopTab } from "./shop";

export class StatePage extends StatelessWidget {
  static route = "/state";
  static metadata = () => ({
    title: "État",
    description: "StatefulWidget et setState, état partagé avec ChangeNotifier et Provider.",
  });

  override build() {
    const theme = Theme.of();
    const count = Provider.select(CartModel, (cart) => cart.items.length);

    const shop = Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [Text("Boutique", { style: theme.textTheme.titleSmall }), ShopTab.new()],
    });
    const cart = Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [Text(`Panier (${count})`, { style: theme.textTheme.titleSmall }), CartTab.new()],
    });

    return DemoShell({
      current: StatePage.route,
      title: "État",
      description: "L'état local d'un widget avec setState, et un état partagé entre widgets avec Provider.",
      children: [
        DemoSection({
          title: "StatefulWidget",
          description: "L'état est un champ de la classe ; setState reconstruit le widget.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Counter.new({ initialValue: 3 }),
              CodeBlock({
                code: `class Counter extends StatefulWidget {
  private count = 0;

  override build() {
    return ElevatedButton({
      onPressed: () => this.setState(() => { this.count++; }),
      child: \`\${this.count}\`,
    });
  }
}`,
              }),
            ],
          }),
        }),

        DemoSection({
          title: "ChangeNotifier + Provider",
          description:
            "Le panier (CartModel) est fourni à toute l'app dans main.tsx. La boutique l'utilise avec Provider.read, le panier l'écoute avec Provider.watch. Il garde son contenu quand vous changez de page.",
          child: ResponsiveLayout({
            compact: Column({ crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 16, children: [shop, cart] }),
            expanded: Row({
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 24,
              children: [Expanded({ child: shop }), Expanded({ child: cart })],
            }),
          }),
        }),
      ],
    });
  }
}
