import { createElement } from "react";
import { init as initCMS } from "decap-cms-app/init";
import type { CmsConfig, CMS } from "decap-cms-app";
import { CollectionRegistry } from "./registry.js";
import { Preview } from "./preview.js";

type Options = {
  registry: CollectionRegistry;
  css: string;
  config: Omit<CmsConfig, "collections">;
  setup?: (cms: CMS) => void;
};
export function init({ registry, css, config, setup }: Options) {
  initCMS({
    config: {
      ...config,
      collections: registry.collections,
    },
    async setup(cms) {
      for (const c of registry.collections) {
        cms.registerPreviewTemplate(c.name, (props) =>
          createElement(Preview, {
            ...props,
            css,
            layout: registry.getLayout(c.name),
          })
        );
      }

      await setup?.(cms);
    },
  });
}
