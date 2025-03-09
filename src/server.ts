import { prerenderToNodeStream } from "react-dom/static";
import { createElement } from "react";
import { Content } from "./content.js";
import { DefaultDocument } from "./default-document.js";
import { CollectionRegistry } from "./registry.js";

export { Content };

export function createRenderFunction(
  registry: CollectionRegistry,
  document = DefaultDocument
) {
  const content = new Content(registry);
  return async (url: string) => {
    const children = await content.resolve(url);
    if (children) {
      return prerenderToNodeStream(createElement(document, { children }));
    }
  };
}

export async function listAllPaths(registry: CollectionRegistry) {
  return new Content(registry).listAllPaths();
}
