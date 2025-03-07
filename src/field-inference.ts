import type {
  CmsField,
  CmsCollection,
  CmsCollectionFile,
  CmsFieldRelation,
  CmsFieldMeta,
  CmsFieldNumber,
  CmsFieldBoolean,
} from "decap-cms-core";
import type {
  ObjectField,
  StringField,
  MultiSelectField,
  VariableListField,
  SingleWidgetListField,
  MultiWidgetListField,
  SelectField,
} from "./decap-types";
import { CollectionRegistry } from "./registry";

type CollectionByName<R extends CollectionRegistry, N extends string> = Extract<
  R["collections"][number],
  { name: N }
>;

export type PreviewableCollectionNames<R extends CollectionRegistry> = Exclude<
  CollectionByName<R, "preview">,
  CollectionWithoutPreview
>["name"];

type CollectionWithoutPreview = CmsCollection & {
  editor: {
    preview: false;
  };
};

type CollectionFields<C extends CmsCollection> = C extends {
  fields: CmsField[];
}
  ? C["fields"]
  : C extends { files: CmsCollectionFile[] }
  ? C["files"][number]["fields"]
  : never;

type LoadAllHint = `loadAll(${string})`;
type LoadHint = `load(${string},${string})`;

type ExtractLoadAll<H extends string> = H extends LoadAllHint
  ? H extends `loadAll(${infer C})`
    ? C
    : never
  : never;

type ExtractLoad<H extends string> = H extends LoadHint
  ? H extends `load(${infer C},${infer S})`
    ? [C, S]
    : never
  : never;

export type InferFieldType<
  F extends CmsField,
  R extends CollectionRegistry
> = F extends {
  widget: "hidden";
  hint?: string;
}
  ? F["hint"] extends LoadAllHint
    ? Array<
        InferCollection<CollectionByName<R, ExtractLoadAll<F["hint"]>>, R> & {
          slug: string;
          href: string;
        }
      >
    : F["hint"] extends LoadHint
    ? CollectionByName<R, ExtractLoad<F["hint"]>[0]> extends {
        files: CmsCollectionFile[];
      }
      ? InferFields<
          Extract<
            CollectionByName<R, ExtractLoad<F["hint"]>[0]>["files"][number],
            { name: ExtractLoad<F["hint"]>[1] }
          >["fields"],
          R
        >
      : InferCollection<CollectionByName<R, ExtractLoad<F["hint"]>[0]>, R>
    : never
  : F extends StringField
  ? string
  : F extends CmsFieldNumber
  ? number
  : F extends CmsFieldBoolean
  ? boolean
  : F extends CmsFieldRelation
  ? InferCollection<CollectionByName<R, F["collection"]>, R> & {
      slug: string;
      href: string;
    }
  : F extends SelectField
  ? F["options"][number]
  : F extends MultiSelectField
  ? string[]
  : F extends VariableListField
  ? Array<InferVariableListItem<F, R>>
  : F extends SingleWidgetListField
  ? Array<InferFieldType<F["field"], R>>
  : F extends MultiWidgetListField
  ? Array<InferFields<F["fields"], R>>
  : F extends ObjectField
  ? InferFields<F["fields"], R>
  : F extends CmsFieldMeta
  ? any
  : unknown;

export type InferVariableListItem<
  F extends VariableListField,
  C extends CollectionRegistry
> = {
  [K in F["types"][number] as K["name"]]: InferFields<K["fields"], C> & {
    type: K["name"];
  };
}[F["types"][number]["name"]];

export type InferFields<
  F extends readonly [...CmsField[]],
  R extends CollectionRegistry
> = {
  [K in F[number] as K["name"]]: K extends { required: false }
    ? InferFieldType<K, R> | undefined
    : InferFieldType<K, R>;
} extends infer T
  ? {
      [P in keyof T as undefined extends T[P] ? never : P]: T[P];
    } & {
      [P in keyof T as undefined extends T[P] ? P : never]?: Exclude<
        T[P],
        undefined
      >;
    }
  : never;

export type InferBlock<F, R extends CollectionRegistry> = F extends ObjectField
  ? InferFields<F["fields"], R>
  : never;

export type InferCollection<
  C,
  R extends CollectionRegistry
> = C extends CmsCollection
  ? InferFields<CollectionFields<C>, R> & { slug: string }
  : C extends string
  ? InferFields<CollectionFields<CollectionByName<R, C>>, R> & { slug: string }
  : never;
