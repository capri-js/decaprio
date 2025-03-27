import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import { Fragment } from "react";
import { ReactEditorComponentOptions } from "./editor-components.js";

export function markdown(
  editorComponents: ReactEditorComponentOptions[],
  opts: MarkdownToJSX.Options = {}
) {
  const { overrides = {}, wrapper = Fragment, ...rest } = opts;
  for (const { id, toPreview } of editorComponents) {
    overrides[id] = {
      component: toPreview,
    };
  }
  const options = {
    wrapper,
    overrides,
    ...opts,
  };

  return ({ content }: { content: string }) => (
    <Markdown options={options}>{content?.replace(/\\\n/g, "\n")}</Markdown>
  );
}
