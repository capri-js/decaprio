import { Collection } from "./decap-types.js";
import { stripIndex } from "./match.js";

export type Item<T = {}> = T & {
  slug: string;
  href: string;
  active?: boolean;
};

export type TreeItem<T> = Item<T> & {
  children: TreeItem<T>[];
};

function bySlug(a: Item, b: Item) {
  return a.slug.localeCompare(b.slug);
}

export function sortBySlug<T>(items: Item<T>[]) {
  const sorted = [...items];
  sorted.sort(bySlug);
  return sorted;
}

function normalize<T>(collection: Collection, items: Item<T>[]): Item<T>[] {
  return items.map(({ slug, ...rest }) => ({
    slug: stripIndex(collection, slug),
    ...rest,
  })) as any;
}
function isActive(item: Item, activeSlug?: string) {
  return activeSlug ? activeSlug.startsWith(item.slug) : item.slug === "";
}

export function getChildren<T>(
  collection: Collection,
  slug: string,
  candidates: Item<T>[],
  activeSlug?: string
): Item<T>[] {
  const parentSlug = stripIndex(collection, slug);
  return sortBySlug(
    normalize(collection, candidates)
      .filter(({ slug }) => isParent(parentSlug, slug))
      .map((item) => ({ ...item, active: isActive(item, activeSlug) }))
  );
}

function isParent(potentialParent: string, slug: string) {
  return (
    slug.startsWith(potentialParent) &&
    slug !== potentialParent &&
    slug.lastIndexOf("/") <= potentialParent.length
  );
}

export function getSubTree<T>(
  collection: Collection,
  all: Item<T>[],
  activeSlug?: string,
  parent = ""
): TreeItem<T>[] {
  return getChildren<T>(collection, parent, all, activeSlug).map((item) => ({
    ...item,
    children:
      item.slug === parent
        ? []
        : getSubTree<T>(collection, all, activeSlug, item.slug),
  }));
}
