import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Column,
  CrossAxisAlignment,
  EdgeInsets,
  Icon,
  IconButton,
  ListTile,
  Padding,
  Provider,
  Row,
  showSnackBar,
  SnackBar,
  SnackBarAction,
  Spacer,
  StatelessWidget,
  Text,
  TextButton,
  Theme,
} from "../../../index";
import { CartModel, formatPrice, PRODUCTS } from "../models/CartModel";

/** Liste des produits. Lit le panier sans l'écouter : il ne fait qu'y ajouter. */
export class ShopTab extends StatelessWidget {
  override build() {
    const cart = Provider.read(CartModel);

    return Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: PRODUCTS.map((product) =>
        ListTile({
          title: product.name,
          subtitle: formatPrice(product.price),
          trailing: IconButton({
            icon: Icon(AddShoppingCartIcon),
            tooltip: "Ajouter au panier",
            onPressed: () => cart.add(product),
          }),
        })
      ),
    });
  }
}

/** Contenu du panier. L'écoute : se reconstruit à chaque changement. */
export class CartTab extends StatelessWidget {
  override build() {
    const cart = Provider.watch(CartModel);
    const theme = Theme.of();

    if (cart.items.length === 0) {
      return Padding({
        padding: EdgeInsets.all(24),
        child: Text("Le panier est vide.", { style: { color: theme.colorScheme.onSurfaceVariant } }),
      });
    }

    const clear = () => {
      const previous = cart.items;
      cart.clear();
      showSnackBar(
        SnackBar({
          content: "Panier vidé",
          action: SnackBarAction({ label: "Annuler", onPressed: () => previous.forEach((p) => cart.add(p)) }),
        })
      );
    };

    return Column({
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...cart.items.map((product, index) =>
          ListTile({
            title: product.name,
            subtitle: formatPrice(product.price),
            trailing: IconButton({
              icon: Icon(DeleteIcon),
              tooltip: "Retirer",
              onPressed: () => cart.removeAt(index),
            }),
          })
        ),
        Padding({
          padding: EdgeInsets.all(16),
          child: Row({
            children: [
              Text(`Total : ${formatPrice(cart.total)}`, { style: theme.textTheme.titleMedium }),
              Spacer(),
              TextButton({ onPressed: clear, child: "Vider" }),
            ],
          }),
        }),
      ],
    });
  }
}
