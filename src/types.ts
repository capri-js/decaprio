import { Collection, CollectionFile } from "./decap-types.js";

export type FolderCollectionConfig = Omit<Collection, "files"> & {
  //files: never;
};
export type CollectionFileConfig = Omit<CollectionFile, "path"> & {
  path?: string;
};
export type FilesCollectionConfig = Omit<Collection, "files" | "folder"> & {
  //folder: never;
  files: CollectionFileConfig[];
};
export type CollectionConfig = FolderCollectionConfig | FilesCollectionConfig;

export function isFilesCollectionConfig(
  collection: CollectionConfig
): collection is FilesCollectionConfig {
  return "files" in collection;
}
