import { ComponentType } from "react";
import {
  Collection,
  FilesCollection,
  FolderCollection,
} from "./decap-types.js";

export abstract class Layout<T extends Collection> {
  constructor(public collection: T) {}
  getLayout(): ComponentType<any> {
    throw new Error("Use either a FilesLayout or FolderLayout subclass.");
  }
}

export class FolderLayout<T extends FolderCollection> extends Layout<T> {
  constructor(collection: T, private component: ComponentType<any>) {
    super(collection);
  }
  getLayout() {
    return this.component;
  }
}

export class FilesLayout<T extends FilesCollection> extends Layout<T> {
  constructor(
    collection: T,
    private components: Record<T["files"][number]["name"], ComponentType<any>>
  ) {
    super(collection);
  }
  getLayout(name?: string): ComponentType<any> {
    if (!name) {
      throw new Error("Missing file name.");
    }
    return this.components[name as keyof typeof this.components];
  }
}
