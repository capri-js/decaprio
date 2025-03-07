import { init, CmsConfig, CMS } from "decap-cms-app/init";
import { CollectionRegistry } from "./registry";
import { Preview } from "./preview";
import { createElement } from "react";

type Options = {
  registry: CollectionRegistry;
  css: string;
  config: Omit<CmsConfig, "collections">;
  setup?: (cms: CMS) => void;
};
export function initDecapCMS({ registry, css, config, setup }: Options) {
  init({
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
