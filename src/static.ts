import { prerenderToNodeStream } from "react-dom/static";
import { createElement } from "react";
import { Content } from "./server.js";
import { DefaultDocument } from "./default-document.js";
import { CollectionRegistry } from "./registry.js";

export { Content };

export function ssr(registry: CollectionRegistry, document = DefaultDocument) {
  const content = new Content(registry);
  return {
    async render(url: string) {
      const children = await content.resolve(url);
      if (children) {
        return prerenderToNodeStream(createElement(document, { children }));
      }
    },
    async getStaticPaths() {
      return content.listAllPaths();
    },
  };
}
