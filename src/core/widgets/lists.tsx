"use client";

import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Axis, EdgeInsets } from "./painting";

interface ListViewBaseProps {
  /** Sens du défilement. Par défaut `vertical`. */
  scrollDirection?: Axis;
  padding?: EdgeInsets;
  /**
   * `true` : la liste prend la taille de son contenu, sans défilement propre
   * (liste dans une page qui défile déjà). Par défaut, la liste remplit son
   * parent (Expanded, SizedBox…) et défile.
   */
  shrinkWrap?: boolean;
}

function listStyle({ scrollDirection, padding, shrinkWrap }: ListViewBaseProps): CSSProperties {
  const vertical = scrollDirection !== "horizontal";
  return {
    display: "flex",
    flexDirection: vertical ? "column" : "row",
    boxSizing: "border-box",
    padding: padding?.toCss(),
    ...(!shrinkWrap && {
      flex: "1 1 0%",
      minWidth: 0,
      minHeight: 0,
      [vertical ? "height" : "width"]: "100%",
      [vertical ? "overflowY" : "overflowX"]: "auto",
    }),
  };
}

export interface ListViewProps extends ListViewBaseProps {
  children?: ReactNode[];
}

/** Liste défilante d'enfants déjà construits. Pour une longue liste : `ListView.builder`. */
export function ListView({ children = [], ...base }: ListViewProps = {}): ReactElement {
  return createElement("div", { style: listStyle(base) }, ...children);
}

export interface ListViewBuilderProps extends ListViewBaseProps {
  itemCount: number;
  /** Construit l'élément `index` (le `(context, index)` de Flutter, sans contexte). */
  itemBuilder: (index: number) => ReactNode;
  /**
   * Taille fixe de chaque élément (hauteur, ou largeur en horizontal).
   * Si fournie, seuls les éléments visibles sont rendus : idéal pour des
   * milliers d'éléments. Sinon, tous les éléments sont rendus.
   */
  itemExtent?: number;
}

/** Liste construite à la demande, élément par élément. */
ListView.builder = function builder({
  itemCount,
  itemBuilder,
  itemExtent,
  ...base
}: ListViewBuilderProps): ReactElement {
  if (itemExtent !== undefined) {
    return createElement(VirtualList, { itemCount, itemBuilder, itemExtent, ...base });
  }
  const items = Array.from({ length: itemCount }, (_, index) => itemBuilder(index));
  return createElement("div", { style: listStyle(base) }, ...items);
};

export interface ListViewSeparatedProps extends ListViewBaseProps {
  itemCount: number;
  itemBuilder: (index: number) => ReactNode;
  /** Séparateur placé après l'élément `index` (sauf le dernier). */
  separatorBuilder: (index: number) => ReactNode;
}

/** Liste avec un séparateur entre chaque élément. */
ListView.separated = function separated({
  itemCount,
  itemBuilder,
  separatorBuilder,
  ...base
}: ListViewSeparatedProps): ReactElement {
  const items = Array.from({ length: itemCount }).flatMap((_, index) =>
    index < itemCount - 1 ? [itemBuilder(index), separatorBuilder(index)] : [itemBuilder(index)]
  );
  return createElement("div", { style: listStyle(base) }, ...items);
};

// --- Liste virtualisée ------------------------------------------------------

/** Éléments rendus en plus de part et d'autre de la zone visible. */
const OVERSCAN = 5;
/** Éléments rendus côté serveur, avant de connaître la taille de l'écran. */
const INITIAL_COUNT = 20;

function VirtualList({
  itemCount,
  itemBuilder,
  itemExtent,
  ...base
}: ListViewBuilderProps & { itemExtent: number }) {
  const vertical = base.scrollDirection !== "horizontal";
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: Math.min(itemCount, INITIAL_COUNT) });

  const update = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const offset = vertical ? element.scrollTop : element.scrollLeft;
    const size = vertical ? element.clientHeight : element.clientWidth;
    const start = Math.max(0, Math.floor(offset / itemExtent) - OVERSCAN);
    const end = Math.min(itemCount, Math.ceil((offset + size) / itemExtent) + OVERSCAN);
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [vertical, itemExtent, itemCount]);

  // Recalcule au montage et quand la liste change de taille.
  useEffect(() => {
    update();
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [update]);

  const items: ReactElement[] = [];
  // Borné par itemCount : la liste a pu rétrécir (filtre) avant le recalcul.
  for (let index = range.start; index < Math.min(range.end, itemCount); index++) {
    items.push(
      <div
        key={index}
        style={{
          position: "absolute",
          [vertical ? "top" : "left"]: index * itemExtent,
          [vertical ? "height" : "width"]: itemExtent,
          [vertical ? "left" : "top"]: 0,
          [vertical ? "right" : "bottom"]: 0,
        }}
      >
        {itemBuilder(index)}
      </div>
    );
  }

  return (
    <div ref={ref} onScroll={update} style={{ ...listStyle(base), display: "block" }}>
      <div
        style={{
          position: "relative",
          [vertical ? "height" : "width"]: itemCount * itemExtent,
          [vertical ? "width" : "height"]: "100%",
        }}
      >
        {items}
      </div>
    </div>
  );
}

// --- GridView ---------------------------------------------------------------

interface GridLayout {
  /** Espace entre les lignes. */
  mainAxisSpacing?: number;
  /** Espace entre les colonnes. */
  crossAxisSpacing?: number;
  /** Largeur / hauteur de chaque case. Par défaut 1 (carré). */
  childAspectRatio?: number;
}

export interface SliverGridDelegate extends GridLayout {
  /** Valeur CSS `grid-template-columns`. */
  columns: string;
}

/** Nombre de colonnes fixe. */
export function SliverGridDelegateWithFixedCrossAxisCount({
  crossAxisCount,
  ...layout
}: GridLayout & { crossAxisCount: number }): SliverGridDelegate {
  return { columns: `repeat(${crossAxisCount}, minmax(0, 1fr))`, ...layout };
}

/**
 * Nombre de colonnes selon la largeur disponible. Approximation CSS : les cases
 * font au moins `maxCrossAxisExtent` (en Flutter, au plus), autant de colonnes que possible.
 */
export function SliverGridDelegateWithMaxCrossAxisExtent({
  maxCrossAxisExtent,
  ...layout
}: GridLayout & { maxCrossAxisExtent: number }): SliverGridDelegate {
  return {
    columns: `repeat(auto-fill, minmax(min(${maxCrossAxisExtent}px, 100%), 1fr))`,
    ...layout,
  };
}

function grid(
  { columns, mainAxisSpacing = 0, crossAxisSpacing = 0, childAspectRatio = 1 }: SliverGridDelegate,
  base: ListViewBaseProps,
  children: ReactNode[]
): ReactElement {
  const cell: CSSProperties = { aspectRatio: String(childAspectRatio), minWidth: 0, overflow: "hidden" };
  return createElement(
    "div",
    {
      style: {
        ...listStyle(base),
        display: "grid",
        gridTemplateColumns: columns,
        rowGap: mainAxisSpacing,
        columnGap: crossAxisSpacing,
        alignContent: "start",
      },
    },
    ...children.map((child) => createElement("div", { style: cell }, child))
  );
}

export interface GridViewProps extends ListViewBaseProps {
  gridDelegate: SliverGridDelegate;
  children?: ReactNode[];
}

/** Grille défilante. Raccourcis : `GridView.count`, `GridView.extent`, `GridView.builder`. */
export function GridView({ gridDelegate, children = [], ...base }: GridViewProps): ReactElement {
  return grid(gridDelegate, base, children);
}

/** Grille à nombre de colonnes fixe. */
GridView.count = function count({
  crossAxisCount,
  mainAxisSpacing,
  crossAxisSpacing,
  childAspectRatio,
  children = [],
  ...base
}: ListViewBaseProps &
  GridLayout & { crossAxisCount: number; children?: ReactNode[] }): ReactElement {
  const delegate = SliverGridDelegateWithFixedCrossAxisCount({
    crossAxisCount,
    mainAxisSpacing,
    crossAxisSpacing,
    childAspectRatio,
  });
  return grid(delegate, base, children);
};

/** Grille dont le nombre de colonnes dépend de la largeur. */
GridView.extent = function extent({
  maxCrossAxisExtent,
  mainAxisSpacing,
  crossAxisSpacing,
  childAspectRatio,
  children = [],
  ...base
}: ListViewBaseProps &
  GridLayout & { maxCrossAxisExtent: number; children?: ReactNode[] }): ReactElement {
  const delegate = SliverGridDelegateWithMaxCrossAxisExtent({
    maxCrossAxisExtent,
    mainAxisSpacing,
    crossAxisSpacing,
    childAspectRatio,
  });
  return grid(delegate, base, children);
};

/** Grille construite élément par élément (tous les éléments sont rendus). */
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
  return grid(gridDelegate, base, Array.from({ length: itemCount }, (_, i) => itemBuilder(i)));
};
