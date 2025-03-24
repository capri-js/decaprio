import type {
  CmsCollection,
  CmsCollectionFile,
  CmsField,
  CmsFieldBase,
  CmsFieldStringOrText,
  CmsFieldColor,
  CmsFieldMarkdown,
  CmsFieldObject,
  CmsFieldSelect,
  CmsFieldList,
  CmsFieldFileOrImage,
  CmsFieldRelation,
  CmsFieldDateTime,
} from "decap-cms-app";

export { type CmsCollection, CmsField, CmsCollectionFile };

export type FilesCollection = CmsCollection & {
  files: CmsCollectionFile[];
};

export type FolderCollection = CmsCollection & {
  folder: string;
};

export function isFolderCollection(
  collection: CmsCollection
): collection is FolderCollection {
  return "folder" in collection && !("files" in collection);
}

export function isFilesCollection(
  collection: CmsCollection
): collection is FilesCollection {
  return "files" in collection;
}

export function isNested(collection: CmsCollection) {
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
  | CmsFieldStringOrText
  | CmsFieldMarkdown
  | CmsFieldColor
  | CmsFieldFileOrImage
  | CmsFieldDateTime;
