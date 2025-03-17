import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import { Fragment } from "react";
import { ReactEditorComponentOptions } from "./editor-components.js";

export function markdown(opts: ReactEditorComponentOptions[]) {
  const overrides: MarkdownToJSX.Overrides = {};
  for (const { id, toPreview } of opts) {
    overrides[id] = {
      component: toPreview,
    };
  }
  const options = {
    wrapper: Fragment,
    overrides,
  };

  return ({ content }: { content: string }) => (
    <Markdown options={options}>{content.replace(/\\\n/g, "\n")}</Markdown>
  );
}
