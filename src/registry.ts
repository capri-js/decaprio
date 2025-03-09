import { ComponentType } from "react";
import { CmsCollection } from "./decap-types.js";

export class Layout<T extends CmsCollection> {
  constructor(public readonly collection: T, public readonly component: any) {}
}

export type CollectionOrLayout<T extends CmsCollection = any> = T | Layout<T>;

export type ExtractCollection<T extends CollectionOrLayout> = T extends Layout<
  infer C
>
  ? C
  : T;

export class CollectionRegistry<T extends CollectionOrLayout[] = any> {
  readonly collections: ExtractCollection<T[number]>[];
  readonly layouts: Record<string, ComponentType<any>> = {};
  constructor(collections: T) {
    this.collections = collections.map((c) =>
      c instanceof Layout ? c.collection : c
    );
    for (const c of collections) {
      if (c instanceof Layout) {
        this.layouts[c.collection.name] = c.component;
      }
    }
  }

  getCollection(name: string) {
    const collection = this.collections.find((c) => c.name === name);
    if (!collection) {
      throw new Error(`Collection '${name}' not found`);
    }
    return collection;
  }

  getLayout(name: string) {
    const layout = this.layouts[name];
    if (!layout) {
      throw new Error(`Layout '${name}' not found`);
    }
    return layout;
  }
}
