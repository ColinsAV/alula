import { createElement, type ReactElement, type ReactNode } from "react";
import { ChangeNotifierProviderView, ListenableBuilderView, MultiProviderView } from "./provider";

// État partagé entre widgets, comme ChangeNotifier + le package `provider`
// en Flutter : un objet garde l'état, appelle `notifyListeners()` quand il
// change, et les widgets qui l'écoutent se reconstruisent.
//
// Ce fichier n'est pas "use client" : les classes et les fabriques de widgets
// doivent rester utilisables côté serveur (main.tsx, pages importées pour
// leurs métadonnées). Les hooks sont dans provider.tsx.

// --- ChangeNotifier / ValueNotifier -----------------------------------------

/**
 * Un objet qui prévient ses écouteurs quand il change :
 * ```ts
 * class CartModel extends ChangeNotifier {
 *   items: Product[] = [];
 *   add(product: Product) {
 *     this.items.push(product);
 *     this.notifyListeners();
 *   }
 * }
 * ```
 */
export class ChangeNotifier {
  private _listeners = new Set<() => void>();
  /** @internal Incrémenté à chaque notification : c'est ce que React compare. */
  _version = 0;

  addListener(listener: () => void): void {
    this._listeners.add(listener);
  }

  removeListener(listener: () => void): void {
    this._listeners.delete(listener);
  }

  get hasListeners(): boolean {
    return this._listeners.size > 0;
  }

  /** Reconstruit les widgets qui écoutent cet objet. */
  notifyListeners(): void {
    this._version++;
    this._listeners.forEach((listener) => listener());
  }

  /**
   * Appelé quand le ChangeNotifierProvider qui l'a créé disparaît. À
   * surcharger pour arrêter un timer, fermer une connexion…
   */
  dispose(): void {
    this._listeners.clear();
  }
}

/** Une seule valeur observable : `counter.value++` reconstruit les widgets qui l'écoutent. */
export class ValueNotifier<T> extends ChangeNotifier {
  constructor(private _value: T) {
    super();
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    if (Object.is(value, this._value)) return;
    this._value = value;
    this.notifyListeners();
  }
}

// --- Widgets ----------------------------------------------------------------

/**
 * Reconstruit `builder` à chaque changement de `listenable`, sans Provider :
 * ```ts
 * ListenableBuilder({ listenable: cart, builder: () => Text(`${cart.items.length} articles`) })
 * ```
 */
export function ListenableBuilder({
  listenable,
  builder,
}: {
  listenable: ChangeNotifier;
  builder: () => ReactNode;
}): ReactElement {
  return createElement(ListenableBuilderView, { listenable, builder });
}

/** Comme ListenableBuilder, pour un ValueNotifier : `builder` reçoit la valeur. */
export function ValueListenableBuilder<T>({
  valueListenable,
  builder,
}: {
  valueListenable: ValueNotifier<T>;
  builder: (value: T) => ReactNode;
}): ReactElement {
  return ListenableBuilder({ listenable: valueListenable, builder: () => builder(valueListenable.value) });
}

export interface ChangeNotifierProviderProps<T extends ChangeNotifier> {
  /** Crée l'objet, une seule fois. */
  create: () => T;
  /** Inutile dans `MaterialApp({ providers })` ou `MultiProvider`. */
  child?: ReactNode;
}

/**
 * Fournit un ChangeNotifier aux widgets en dessous, qui le lisent avec
 * `Provider.watch(MaClasse)`. Pour toute l'app :
 * `<MaterialApp providers={[ChangeNotifierProvider({ create: () => new CartModel() })]} />`.
 * Pour une partie de la page : `ChangeNotifierProvider({ create, child })`.
 *
 * L'objet est créé au montage et `dispose()` est appelé au démontage.
 */
export function ChangeNotifierProvider<T extends ChangeNotifier>(
  props: ChangeNotifierProviderProps<T>
): ReactElement<ChangeNotifierProviderProps<T>> {
  return createElement(ChangeNotifierProviderView, props) as ReactElement<ChangeNotifierProviderProps<T>>;
}

/** Plusieurs providers d'un coup, imbriqués dans l'ordre (le premier tout en haut). */
export function MultiProvider(props: { providers: ReactElement[]; child?: ReactNode }): ReactElement {
  return createElement(MultiProviderView, props);
}
