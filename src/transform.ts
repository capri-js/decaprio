import immutable from "immutable";
import type { CmsField } from "decap-cms-core";
import {
  isRelationField,
  CmsCollection,
  isFolderCollection,
} from "./decap-types";
import { getPathForSlug } from "./match";

type Immutable = immutable.Iterable<unknown, unknown>;

function isList(value: unknown): value is immutable.List<unknown> {
  return immutable.List.isList(value);
}

function isMap(value: unknown): value is immutable.Map<unknown, unknown> {
  return immutable.Map.isMap(value);
}

function nestedFields(f?: CmsField): CmsField[] {
  if (f) {
    if ("types" in f) {
      return f.types ?? [];
    }
    if ("fields" in f) {
      return f.fields ?? [];
    }
    if ("field" in f) {
      return f.field ? [f.field] : [];
    }
  }
  return [];
}

function collectionFields(c: CmsCollection, slug: string) {
  if (isFolderCollection(c)) {
    return c.fields ?? [];
  }
  return c.files?.find((f) => f.name === slug)?.fields ?? [];
}

interface TransformOptions {
  load: (collection: string, slug: string) => Promise<unknown>;
  loadAll: (collection: string) => Promise<unknown[]>;
  getCollection: (collection: string) => CmsCollection;
  getAsset?: (path: string) => string;
  preview?: boolean;
}

export function createTransform({
  load,
  loadAll,
  getAsset,
  getCollection,
  preview = false,
}: TransformOptions) {
  const previousData = new Map();
  const cache = new Map();

  const getHref = (collectionName: string, slug: string) => {
    const collection = getCollection(collectionName);
    if (!collection) return slug;
    return getPathForSlug(collection, slug, preview);
  };

  const transformValue = async (value: unknown, field: CmsField) => {
    if (isRelationField(field) && typeof value === "string") {
      const loadedValue = await load(field.collection, value);
      if (loadedValue) {
        (loadedValue as any).slug = value;
        (loadedValue as any).href = getHref(field.collection, value);
        return loadedValue;
      }
      console.log("Failed to load relation", field.collection, value);
      return null;
    } else if (
      getAsset &&
      field.widget === "image" &&
      typeof value === "string"
    ) {
      return getAsset(value);
    }
    return value;
  };

  const loadAndTransform = async (collectionName: string, slug: string) => {
    const value = await load(collectionName, slug);
    const entry = isMap(value) ? value : immutable.fromJS(value);
    const collection = getCollection(collectionName);
    const fields = collectionFields(collection, slug);
    return visit(entry, fields, `${collectionName}/${slug}:`);
  };

  const visit = async (
    value: Immutable,
    fields: CmsField[],
    path = ""
  ): Promise<Immutable> => {
    if (!fields?.length) {
      return value;
    }
    const prevValue = previousData.get(path);
    if (value === prevValue) {
      return cache.get(path) ?? value;
    }
    previousData.set(path, value);

    let result;
    if (isList(value)) {
      let newList = value;
      for (let i = 0; i < newList.size; i++) {
        const item = newList.get(i);
        if (isMap(item)) {
          const itemType = item.get("type");
          if (itemType) {
            const field = fields.find((f) => f.name === itemType);
            const newItem = await visit(
              item,
              nestedFields(field),
              `${path}.${i}`
            );
            newList = newList.set(i, newItem);
          } else {
            const newItem = await visit(item, fields, `${path}.${i}`);
            newList = newList.set(i, newItem);
          }
        } else {
          const field = fields[0];
          const transformedValue = await transformValue(item, field);
          if (transformedValue === null) {
            newList = newList.delete(i);
            i--;
          } else if (transformedValue !== item) {
            newList = newList.set(i, transformedValue);
          }
        }
      }
      result = newList;
    } else if (isMap(value)) {
      let newMap = value;
      for (const [key, val] of newMap.entrySeq().toArray()) {
        const field = fields.find((f) => f.name === key);
        if (field) {
          const transformedValue = await transformValue(val, field);
          if (transformedValue !== val) {
            newMap = newMap.set(key, transformedValue);
          } else {
            const newVal = await visit(
              val,
              nestedFields(field),
              `${path}.${key}`
            );
            newMap = newMap.set(key, newVal);
          }
        }
      }

      // Look for hidden fields that provide virtual data ...
      const hiddenFields = fields.filter((f) => f.widget === "hidden");
      for (const field of hiddenFields) {
        const fieldName = field.name;
        const match = field.hint?.match(/loadAll\(([^,]*)\)|load\((.*),(.*)\)/);
        if (match) {
          const [, all, collectionName, slug] = match;
          if (slug) {
            const value = await loadAndTransform(collectionName, slug);
            newMap = newMap.set(fieldName, value);
          } else {
            newMap = newMap.set(fieldName, await loadAll(all));
          }
        }
      }

      const relationFields = fields.filter(isRelationField);
      for (const field of relationFields) {
        const fieldName = field.name;
        const slug = value.get(fieldName);
        if (typeof slug === "string") {
          const loadedValue = await load(field.collection, slug);
          if (loadedValue) {
            (loadedValue as any).slug = slug;
            (loadedValue as any).href = getHref(field.collection, slug);
          }
          newMap = newMap.set(fieldName, loadedValue);
        }
      }

      result = newMap;
    } else {
      result = value;
    }

    cache.set(path, result);
    return result;
  };

  return async (value: unknown, fields: CmsField[]) => {
    const immutableValue = isMap(value) ? value : immutable.fromJS(value);
    const transformed = await visit(immutableValue, fields);
    return transformed?.toJS();
  };
}
