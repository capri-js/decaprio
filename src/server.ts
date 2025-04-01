import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "js-yaml";
import matter from "gray-matter";

import {
  Field,
  FilesCollection,
  FolderCollection,
  isFilesCollection,
  isFolderCollection,
  isNested,
} from "./decap-types.js";
import { createTransform } from "./transform.js";
import {
  getIndexFile,
  getPathForSlug,
  stripExtension,
  matchPath,
} from "./match.js";
import { createElement } from "react";
import { CollectionRegistry } from "./registry.js";

export class Content {
  constructor(private registry: CollectionRegistry) {}

  /**
   * Reads a file and returns its parsed content.
   * If the file extension is .md or .mdx, it returns frontmatter and content.
   * If the file extension is .yml or .yaml, it returns the parsed YAML content.
   * Otherwise, it returns null.
   */
  protected async readContent(filePath: string): Promise<any> {
    const fileContent = await fs.readFile(filePath, "utf8");
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".md" || ext === ".mdx") {
      const { data, content } = matter(fileContent);
      return {
        ...data,
        content,
      };
    } else if (ext === ".yml" || ext === ".yaml") {
      return yaml.load(fileContent) ?? {};
    }
    return null;
  }

  /**
   * Checks if a file exists and can be read.
   */
  protected async canRead(filePath: string) {
    try {
      await fs.access(filePath);
      return true;
    } catch (err: any) {
      return false;
    }
  }
  /**
   * Loads all files from a folder collection
   */
  protected async loadFolderCollection(collection: FolderCollection) {
    const files = await fs.readdir(collection.folder, {
      recursive: isNested(collection),
    });
    const matchingFiles = files.filter(
      (file) => path.extname(file) === `.${collection.extension}`
    );
    return Promise.all(
      matchingFiles.map(async (file) => ({
        slug: stripExtension(file),
        ...(await this.readContent(path.join(collection.folder, file))),
      }))
    );
  }

  /**
   * Loads all files from a files collection
   */
  protected async loadFilesCollection(collection: FilesCollection) {
    return Promise.all(
      collection.files.map(async (f) => ({
        slug: stripExtension(f.file),
        ...(await this.readContent(f.file)),
      }))
    );
  }

  protected async loadFileOrIndex(collection: FolderCollection, file: string) {
    const indexFile = getIndexFile(collection);
    const filePath = path.join(
      collection.folder,
      `${file || indexFile}.${collection.extension}`
    );

    if (await this.canRead(filePath)) {
      return this.readContent(filePath);
    }
    if (file) {
      // Try index file inside folder
      const filePath = path.join(
        collection.folder,
        file,
        `${indexFile}.${collection.extension}`
      );
      if (await this.canRead(filePath)) {
        return this.readContent(filePath);
      }
    }
    return null;
  }

  protected async getContentAndFields(
    name: string,
    file: string
  ): Promise<{ data: any; fields: Field[] }> {
    const c = this.registry.getCollection(name);
    if (isFolderCollection(c)) {
      return {
        data: {
          slug: stripExtension(file),
          ...(await this.loadFileOrIndex(c, file)),
        },
        fields: c.fields!,
      };
    } else if (isFilesCollection(c)) {
      const fileConfig = c.files.find((f) => stripExtension(f.file) === file);
      if (!fileConfig) {
        throw new Error(`File '${file}' not found in collection '${name}'`);
      }
      return {
        data: {
          slug: stripExtension(fileConfig.file),
          ...(await this.readContent(fileConfig.file)),
        },
        fields: fileConfig.fields,
      };
    } else {
      throw new Error(
        `Collection '${name}' is neither a folder nor files collection`
      );
    }
  }

  /**
   * Loads a single entry from a collection
   */
  async loadAndTransform(name: string, file: string) {
    const { data, fields } = await this.getContentAndFields(name, file);
    if (data) {
      const transform = createTransform({
        load: async (name: string, file: string) => {
          const { data } = await this.getContentAndFields(name, file);
          return data;
        },
        loadAll: async (name: string) => {
          return this.loadAll(name);
        },
        getCollection: (name: string) => {
          return this.registry.getCollection(name);
        },
      });
      return transform(data, fields);
    }
  }

  /**
   * Loads all entries from a collection
   */
  async loadAll(name: string) {
    const c = this.registry.getCollection(name);

    if (isFolderCollection(c)) {
      return this.loadFolderCollection(c);
    }

    if (isFilesCollection(c)) {
      return this.loadFilesCollection(c);
    }

    throw new Error(
      `Collection '${name}' is neither a folder nor files collection`
    );
  }

  async listAllPaths() {
    const paths = [];
    for (const collection of this.registry.collections) {
      if (isFolderCollection(collection)) {
        if (collection.editor?.preview !== false) {
          const ext = collection.extension ?? "yml";
          const files = await fs.readdir(collection.folder, {
            recursive: isNested(collection),
          });
          paths.push(
            ...files
              .filter((file) => path.extname(file) === `.${ext}`)
              .map((file) => file.slice(0, -ext.length - 1))
              .map((file) => getPathForSlug(collection, file))
          );
        }
      }
    }
    return paths;
  }

  async resolve(slug: string) {
    for (const c of this.registry.collections) {
      const match = matchPath(c, slug);
      if (match !== null) {
        const data = await this.loadAndTransform(c.name, match);
        if (data) {
          const Layout = this.registry.getLayout(c.name);
          return createElement(Layout, data);
        }
      }
    }
  }
}
