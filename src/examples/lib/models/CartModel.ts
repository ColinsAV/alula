import { ChangeNotifier } from "../../../index";

export interface Product {
  id: number;
  name: string;
  price: number;
}

export const PRODUCTS: Product[] = [
  { id: 1, name: "Pomme", price: 0.5 },
  { id: 2, name: "Pain", price: 1.2 },
  { id: 3, name: "Fromage", price: 4.9 },
  { id: 4, name: "Café", price: 6.5 },
];

/** Le panier, partagé par toute l'app (voir `providers` dans main.tsx). */
export class CartModel extends ChangeNotifier {
  items: Product[] = [];

  get total(): number {
    return this.items.reduce((sum, product) => sum + product.price, 0);
  }

  add(product: Product) {
    this.items.push(product);
    this.notifyListeners();
  }

  removeAt(index: number) {
    this.items.splice(index, 1);
    this.notifyListeners();
  }

  clear() {
    this.items = [];
    this.notifyListeners();
  }
}

export const formatPrice = (price: number) => `${price.toFixed(2).replace(".", ",")} €`;
