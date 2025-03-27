import type {
  CmsCollection,
  CmsCollectionFile,
  CmsField,
  CmsFieldBase,
  CmsFieldString,
  CmsFieldText,
  CmsFieldColor,
  CmsFieldMarkdown,
  CmsFieldObject,
  CmsFieldSelect,
  CmsFieldList,
  CmsFieldFileOrImage,
  CmsFieldRelation,
  CmsFieldDateTime,
  CmsFieldMeta,
} from "decap-cms-app";

export type Collection = CmsCollection<false>;

export type Field = Exclude<CmsField<false>, CmsFieldMeta<false>>;

export type CollectionFile = CmsCollectionFile<false>;

export type FilesCollection = Collection & {
  files: CmsCollectionFile[];
};

export type FolderCollection = Collection & {
  folder: string;
};

export function isFolderCollection(
  collection: Collection
): collection is FolderCollection {
  return "folder" in collection && !("files" in collection);
}

export function isFilesCollection(
  collection: Collection
): collection is FilesCollection {
  return "files" in collection;
}

export function isNested(collection: Collection) {
  const depth = "nested" in collection && collection.nested?.depth;
  return !!depth;
}

export function isRelationField(field: unknown): field is RelationField {
  return (
    typeof field === "object" &&
    field !== null &&
    "widget" in field &&
    field.widget === "relation"
  );
}

// Base field types
export type OptionalField = CmsFieldBase & { required: false };
export type ObjectField = CmsFieldBase & CmsFieldObject;
export type VariableListField = CmsFieldBase &
  CmsFieldList & { types: ObjectField[] };
export type SingleWidgetListField = CmsFieldBase &
  CmsFieldList & { field: CmsField };
export type MultiWidgetListField = CmsFieldBase &
  CmsFieldList & { fields: CmsField[] };
export type SelectField = CmsFieldBase & CmsFieldSelect;
export type RelationField = CmsFieldBase & CmsFieldRelation;
export type MultiSelectField = SelectField & { multiple: true };
export type StringField =
  | CmsFieldString
  | CmsFieldText
  | CmsFieldMarkdown
  | CmsFieldColor
  | CmsFieldFileOrImage
  | CmsFieldDateTime;
