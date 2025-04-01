import {
  Collection,
  isFilesCollection,
  isFolderCollection,
} from "./decap-types.js";

function previewPathToRegex(previewPath: string) {
  if (typeof previewPath !== "string") {
    throw new Error("previewPath");
  }
  return new RegExp(
    previewPath.replace(/\{\{.+?\}\}/g, "(.*)").replace(/\//g, "\\/")
  );
}

export function getIndexFile(collection: Collection) {
  return collection.meta?.path?.index_file ?? "index";
}

export function stripIndex(collection: Collection, slug: string) {
  const index = getIndexFile(collection);
  const re = new RegExp(`(^|\\/)${index}$`);
  if (typeof slug !== "string") {
    throw new Error("stripIndex");
  }
  return slug.replace(re, "");
}

function stripLeadingSlash(s: string) {
  if (typeof s !== "string") {
    throw new Error("stripLeadingSlash");
  }
  return s.replace(/^\/(.*)/, "$1");
}

export function stripExtension(file: string) {
  const m = /(.+)\.\w+$/.exec(file);
  return m ? m[1] : file;
}

export function matchPath(collection: Collection, path: string) {
  if (isFolderCollection(collection) && collection.preview_path) {
    const re = previewPathToRegex(collection.preview_path);
    const match = re.exec(path);
    if (match) {
      return match[1];
    }
  } else if (isFilesCollection(collection)) {
    for (const file of collection.files) {
      if (file.preview_path) {
        const re = previewPathToRegex(file.preview_path);
        const match = re.exec(path);
        if (match) {
          return stripExtension(file.file);
        }
      }
    }
  }
  return null;
}

export function getPathForSlug(
  collection: Collection,
  slug: string,
  preview = false
) {
  slug = stripLeadingSlash(stripIndex(collection, slug));
  if (!collection.preview_path) {
    throw new Error("Collection must have a preview path");
  }
  const path = collection.preview_path
    ? collection.preview_path.replace(/\{\{(slug|dirname)\}\}/, slug)
    : `/${slug}`;

  if (preview) {
    const entry = slug || getIndexFile(collection);
    return `${path}#preview=${collection.name}/${entry}`;
  }
  return path;
}
