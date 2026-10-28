import { createElement, useState, type ReactElement, type ReactNode } from "react";
import { FlatList, ScrollView, View, type ViewStyle } from "react-native";
import { textChild } from "./basic.native";
import { insetsStyle } from "./nativeStyle";
import type { Axis, EdgeInsets } from "./painting";

// Listes et grilles sur mobile : ScrollView, et FlatList (virtualisée par
// React Native) pour les listes construites à la demande.

interface ListViewBaseProps {
  scrollDirection?: Axis;
  padding?: EdgeInsets;
  /** `true` : la liste prend la taille de son contenu, sans défilement propre. */
  shrinkWrap?: boolean;
}

const contentStyle = (padding?: EdgeInsets): ViewStyle => insetsStyle(padding, "padding");
const listStyle = ({ shrinkWrap }: ListViewBaseProps): ViewStyle => (shrinkWrap ? { flexGrow: 0 } : { flex: 1 });

export interface ListViewProps extends ListViewBaseProps {
  children?: ReactNode[];
}

/** Liste défilante d'enfants déjà construits. Pour une longue liste : `ListView.builder`. */
export function ListView({ children = [], ...base }: ListViewProps = {}): ReactElement {
  const horizontal = base.scrollDirection === "horizontal";
  if (base.shrinkWrap) {
    return createElement(
      View,
      { style: { flexDirection: horizontal ? "row" : "column", ...contentStyle(base.padding) } },
      ...children.map(textChild)
    );
  }
  return createElement(
    ScrollView,
    { horizontal, style: listStyle(base), contentContainerStyle: contentStyle(base.padding) },
    ...children.map(textChild)
  );
}

export interface ListViewBuilderProps extends ListViewBaseProps {
  itemCount: number;
  itemBuilder: (index: number) => ReactNode;
  /** Taille fixe de chaque élément : défilement plus rapide sur les longues listes. */
  itemExtent?: number;
}

const indices = (count: number) => Array.from({ length: count }, (_, i) => i);

function flatList(
  base: ListViewBaseProps,
  itemCount: number,
  itemBuilder: (index: number) => ReactNode,
  extra: object = {},
  separatorBuilder?: (index: number) => ReactNode
): ReactElement {
  // shrinkWrap : la liste est dans une page qui défile déjà. Une FlatList
  // imbriquée dans une ScrollView est déconseillée : simple View.
  if (base.shrinkWrap) {
    const items = indices(itemCount).flatMap((i) =>
      separatorBuilder && i < itemCount - 1 ? [itemBuilder(i), separatorBuilder(i)] : [itemBuilder(i)]
    );
    return createElement(
      View,
      { style: { flexDirection: base.scrollDirection === "horizontal" ? "row" : "column", ...contentStyle(base.padding) } },
      ...items.map(textChild)
    );
  }
  return createElement(FlatList<number>, {
    data: indices(itemCount),
    keyExtractor: (index) => String(index),
    renderItem: ({ item }) => textChild(itemBuilder(item)) as ReactElement,
    horizontal: base.scrollDirection === "horizontal",
    scrollEnabled: !base.shrinkWrap,
    style: listStyle(base),
    contentContainerStyle: contentStyle(base.padding),
    ...extra,
  });
}

/** Liste construite à la demande, élément par élément. */
ListView.builder = function builder({ itemCount, itemBuilder, itemExtent, ...base }: ListViewBuilderProps): ReactElement {
  return flatList(
    base,
    itemCount,
    itemBuilder,
    itemExtent === undefined
      ? {}
      : { getItemLayout: (_: unknown, index: number) => ({ length: itemExtent, offset: itemExtent * index, index }) }
  );
};

export interface ListViewSeparatedProps extends ListViewBaseProps {
  itemCount: number;
  itemBuilder: (index: number) => ReactNode;
  separatorBuilder: (index: number) => ReactNode;
}

/** Liste avec un séparateur entre chaque élément. */
ListView.separated = function separated({
  itemCount,
  itemBuilder,
  separatorBuilder,
  ...base
}: ListViewSeparatedProps): ReactElement {
  return flatList(
    base,
    itemCount,
    itemBuilder,
    { ItemSeparatorComponent: ({ leadingItem }: { leadingItem: number }) => textChild(separatorBuilder(leadingItem)) },
    separatorBuilder
  );
};

// --- GridView ---------------------------------------------------------------

interface GridLayout {
  mainAxisSpacing?: number;
  crossAxisSpacing?: number;
  childAspectRatio?: number;
}

export type SliverGridDelegate = GridLayout &
  ({ crossAxisCount: number; maxCrossAxisExtent?: never } | { maxCrossAxisExtent: number; crossAxisCount?: never });

export function SliverGridDelegateWithFixedCrossAxisCount({
  crossAxisCount,
  ...layout
}: GridLayout & { crossAxisCount: number }): SliverGridDelegate {
  return { crossAxisCount, ...layout };
}

export function SliverGridDelegateWithMaxCrossAxisExtent({
  maxCrossAxisExtent,
  ...layout
}: GridLayout & { maxCrossAxisExtent: number }): SliverGridDelegate {
  return { maxCrossAxisExtent, ...layout };
}

interface GridViewViewProps {
  delegate: SliverGridDelegate;
  base: ListViewBaseProps;
  itemCount: number;
  itemBuilder: (index: number) => ReactNode;
}

function grid(delegate: SliverGridDelegate, base: ListViewBaseProps, itemCount: number, itemBuilder: (i: number) => ReactNode) {
  return createElement(GridViewView, { delegate, base, itemCount, itemBuilder });
}

function GridViewView({ delegate, base, itemCount, itemBuilder }: GridViewViewProps) {
  // Largeur mesurée : nécessaire pour `maxCrossAxisExtent`.
  const [width, setWidth] = useState(0);
  const { mainAxisSpacing = 0, crossAxisSpacing = 0, childAspectRatio = 1 } = delegate;
  const columns =
    delegate.crossAxisCount ??
    Math.max(1, Math.ceil((width + crossAxisSpacing) / (delegate.maxCrossAxisExtent! + crossAxisSpacing)));

  const cell = (index: number) =>
    createElement(
      View,
      { key: index, style: { flex: 1, aspectRatio: childAspectRatio, overflow: "hidden" } },
      index < itemCount ? textChild(itemBuilder(index)) : null
    );

  // shrinkWrap : grille dans une page qui défile déjà → simples rangées de View.
  if (base.shrinkWrap) {
    const rows = Array.from({ length: Math.ceil(itemCount / columns) }, (_, row) =>
      createElement(
        View,
        { key: row, style: { flexDirection: "row", gap: crossAxisSpacing } },
        // La dernière rangée est complétée par des cases vides, pour garder la largeur des colonnes.
        ...indices(columns).map((col) => cell(row * columns + col))
      )
    );
    return createElement(
      View,
      { onLayout: (event) => setWidth(event.nativeEvent.layout.width), style: { gap: mainAxisSpacing, ...contentStyle(base.padding) } },
      ...rows
    );
  }

  return createElement(FlatList<number>, {
    // numColumns ne peut pas changer sur une FlatList montée : on la recrée.
    key: columns,
    data: indices(itemCount),
    numColumns: columns,
    keyExtractor: (index) => String(index),
    onLayout: (event) => setWidth(event.nativeEvent.layout.width),
    renderItem: ({ item }) =>
      createElement(
        View,
        { style: { flex: 1 / columns, aspectRatio: childAspectRatio, overflow: "hidden" } },
        textChild(itemBuilder(item))
      ),
    columnWrapperStyle: columns > 1 ? { gap: crossAxisSpacing } : undefined,
    ItemSeparatorComponent: () => createElement(View, { style: { height: mainAxisSpacing } }),
    scrollEnabled: !base.shrinkWrap,
    style: listStyle(base),
    contentContainerStyle: contentStyle(base.padding),
  });
}

export interface GridViewProps extends ListViewBaseProps {
  gridDelegate: SliverGridDelegate;
  children?: ReactNode[];
}

/** Grille défilante. Raccourcis : `GridView.count`, `GridView.extent`, `GridView.builder`. */
export function GridView({ gridDelegate, children = [], ...base }: GridViewProps): ReactElement {
  return grid(gridDelegate, base, children.length, (i) => children[i]);
}

GridView.count = function count({
  crossAxisCount,
  mainAxisSpacing,
  crossAxisSpacing,
  childAspectRatio,
  children = [],
  ...base
}: ListViewBaseProps & GridLayout & { crossAxisCount: number; children?: ReactNode[] }): ReactElement {
  const delegate = SliverGridDelegateWithFixedCrossAxisCount({ crossAxisCount, mainAxisSpacing, crossAxisSpacing, childAspectRatio });
  return grid(delegate, base, children.length, (i) => children[i]);
};

GridView.extent = function extent({
  maxCrossAxisExtent,
  mainAxisSpacing,
  crossAxisSpacing,
  childAspectRatio,
  children = [],
  ...base
}: ListViewBaseProps & GridLayout & { maxCrossAxisExtent: number; children?: ReactNode[] }): ReactElement {
  const delegate = SliverGridDelegateWithMaxCrossAxisExtent({ maxCrossAxisExtent, mainAxisSpacing, crossAxisSpacing, childAspectRatio });
  return grid(delegate, base, children.length, (i) => children[i]);
};

GridView.builder = function builder({
  gridDelegate,
  itemCount,
  itemBuilder,
  ...base
}: ListViewBaseProps & {
  gridDelegate: SliverGridDelegate;
  itemCount: number;
  itemBuilder: (index: number) => ReactNode;
}): ReactElement {
  return grid(gridDelegate, base, itemCount, itemBuilder);
};
