import { CmsCollection, CmsCollectionFile } from "./decap-types.js";

export type FolderCollectionConfig = Omit<CmsCollection, "files"> & {
  //files: never;
};
export type CollectionFileConfig = Omit<CmsCollectionFile, "path"> & {
  path?: string;
};
export type FilesCollectionConfig = Omit<CmsCollection, "files" | "folder"> & {
  //folder: never;
  files: CollectionFileConfig[];
};
export type CollectionConfig = FolderCollectionConfig | FilesCollectionConfig;

export function isFilesCollectionConfig(
  collection: CollectionConfig
): collection is FilesCollectionConfig {
  return "files" in collection;
}
