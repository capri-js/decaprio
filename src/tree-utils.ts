import { CmsCollection } from "./decap-types.js";
import { stripIndex } from "./match.js";

type Item = {
  slug: string;
};

export function sortBySlug(collection: CmsCollection, items: Item[]) {
  const bySlug = (a: Item, b: Item) => {
    return stripIndex(collection, a.slug).localeCompare(
      stripIndex(collection, b.slug)
    );
  };
  const sorted = [...items];
  sorted.sort(bySlug);
  return sorted;
}

export function getTopLevelItems(
  collection: CmsCollection,
  candidates: Item[]
) {
  return sortBySlug(
    collection,
    candidates.filter(({ slug }) => !getParentSlug(collection, slug))
  );
}

export function getChildren(
  collection: CmsCollection,
  slug: string,
  candidates: Item[]
) {
  const parentSlug = stripIndex(collection, slug);
  return sortBySlug(
    collection,
    candidates.filter(({ slug }) => isParent(collection, parentSlug, slug))
  );
}

function isParent(
  collection: CmsCollection,
  potentialParent: string,
  slug: string
) {
  const c = stripIndex(collection, slug);
  return (
    c.startsWith(potentialParent) &&
    c.lastIndexOf("/") <= potentialParent.length
  );
}

function getParentSlug(collection: CmsCollection, slug: string) {
  const parts = stripIndex(collection, slug).split("/");
  if (parts.length < 2) return "";
  return parts.slice(0, -1).join("/");
}

export function getSiblings(
  collection: CmsCollection,
  slug: string,
  candidates: Item[]
) {
  const parentSlug = getParentSlug(collection, slug);
  return sortBySlug(
    collection,
    candidates.filter(({ slug }) => isParent(collection, parentSlug, slug))
  );
}
