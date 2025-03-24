import { CollectionOrLayout, CollectionRegistry } from "./registry.js";
import { Block, createBlocksComponent } from "./blocks.js";
import { CmsField, ObjectField } from "./decap-types.js";
import { FilesLayout, FolderLayout, Layout } from "./layout.js";
import { CollectionConfig, isFilesCollectionConfig } from "./types.js";

export type { InferCollection, InferBlock } from "./field-inference.js";

export { markdown } from "./markdown.js";
export { editorComponent } from "./editor-components.js";
export * from "./tree-utils.js";

type DeepMutable<T> = T extends unknown
  ? {
      -readonly [P in keyof T]: DeepMutable<T[P]>;
    }
  : never;

export function field<const F extends CmsField>(field: F): DeepMutable<F> {
  return field as any;
}

export function fields<const F extends CmsField[]>(
  ...fields: F
): DeepMutable<F> {
  return fields as any;
}

export function block<T extends ObjectField>(
  config: T,
  component: any
): Block<T> {
  return {
    config,
    component,
  };
}

export function blocks<const B extends Block[]>(...blocks: B) {
  return {
    types: blocks.map((b) => b.config) as B[number]["config"][],
    Blocks: createBlocksComponent(blocks),
  };
}

const contentFolder = "content";

export function collection<const C extends CollectionConfig>(
  collection: C
): DeepMutable<C> {
  if (isFilesCollectionConfig(collection)) {
    return {
      ...collection,
      files: collection.files.map(({ name, file, fields, ...rest }) => {
        if (!file) {
          const md = fields.some((field) => field.name === "body");
          const ext = md ? "md" : "yml";
          file = `${contentFolder}/${collection.name}/${name}.${ext}`;
        }
        return {
          name,
          file,
          fields,
          ...rest,
        };
      }),
    } as any;
  } else {
    const folder = collection.folder ?? `${contentFolder}/${collection.name}`;
    const md = collection.fields?.some((field) => field.name === "body");
    const extension = collection.extension ?? (md ? "md" : "yml");
    const slug = collection.slug ?? "{{slug}}";
    const create = collection.create ?? true;
    return {
      ...collection,
      folder,
      extension,
      slug,
      create,
    } as any;
  }
}

export function layout<T extends CollectionConfig>(
  collection: T,
  component: any
): Layout<T> {
  const c = {
    // Enable visual editing by default
    editor: {
      visualEditing: true,
    },
    ...collection,
  };

  if (isFilesCollectionConfig(c)) return new FilesLayout(c, component as any);
  return new FolderLayout(c as any, component as any);
}

export function collections<const C extends CollectionOrLayout[]>(
  ...collections: C
) {
  return new CollectionRegistry(collections);
}
