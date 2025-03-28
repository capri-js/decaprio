import { createElement } from "react";
import { init as initCMS } from "decap-cms-app/init";
import type { CmsConfig, CMS } from "decap-cms-app";
import { CollectionRegistry } from "./registry.js";
import { Preview } from "./preview.js";
import { ReactEditorComponentOptions } from "./editor-components.js";
import { isFilesCollection } from "./decap-types.js";

type Options = {
  registry: CollectionRegistry;
  config: Omit<CmsConfig, "collections">;
  editorComponents?: ReactEditorComponentOptions[];
  setup?: (cms: CMS) => void;
};
export function init({
  registry,
  config,
  editorComponents = [],
  setup,
}: Options) {
  initCMS({
    config: {
      ...config,
      collections: registry.collections,
    },
    async setup(cms) {
      for (const c of registry.collections) {
        if (isFilesCollection(c)) {
          c.files.forEach((f) => {
            cms.registerPreviewTemplate(f.name, (props) =>
              createElement(Preview, {
                ...props,
                layout: registry.getLayout(f.name),
              })
            );
          });
        } else {
          cms.registerPreviewTemplate(c.name, (props) =>
            createElement(Preview, {
              ...props,
              layout: registry.getLayout(c.name),
            })
          );
        }
      }
      for (const c of editorComponents) {
        cms.registerEditorComponent(c);
      }
      await setup?.(cms);
    },
  });
}
