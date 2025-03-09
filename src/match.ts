import { CmsCollection, isFolderCollection } from "./decap-types.js";

function previewPathToRegex(previewPath: string) {
  return new RegExp(
    previewPath.replace(/\{\{.+?\}\}/g, "(.*)").replace(/\//g, "\\/")
  );
}

export function getIndexFile(collection: CmsCollection) {
  return collection.meta?.path?.index_file ?? "index";
}

function stripIndex(collection: CmsCollection, slug: string) {
  const index = getIndexFile(collection);
  const re = new RegExp(`(^|\\/)${index}$`);
  return slug.replace(re, "");
}

function stripLeadingSlash(s: string) {
  return s.replace(/^\/(.*)/, "$1");
}

export function matchPath(collection: CmsCollection, path: string) {
  if (isFolderCollection(collection) && collection.preview_path) {
    const re = previewPathToRegex(collection.preview_path);
    const match = re.exec(path);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function getPathForSlug(
  collection: CmsCollection,
  slug: string,
  preview = false
) {
  slug = stripLeadingSlash(stripIndex(collection, slug));
  const path = collection.preview_path
    ? collection.preview_path.replace(/\{\{(slug|dirname)\}\}/, slug)
    : `/${slug}`;

  if (preview) {
    const entry = slug || getIndexFile(collection);
    return `${path}#preview=${collection.name}/${entry}`;
  }
  return path;
}
