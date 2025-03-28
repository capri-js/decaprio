import React from "react";
import { PreviewTemplateComponentProps, CmsConfig } from "decap-cms-app";

import { createTransform } from "./transform.js";
import { useRef, useState, useEffect } from "react";

function useTransform({
  getCollection,
  getAsset,
  config,
}: PreviewTemplateComponentProps) {
  return useRef(
    createTransform({
      preview: true,
      load: async (type, slug) => {
        const doc = await getCollection(type, slug);
        const data = (doc as any).get("data");
        if (Object.keys(data).length === 0) {
          return null;
        }
        data.slug = slug;
        return data;
      },
      loadAll: async (type) => {
        const entries = await getCollection(type);
        return entries.map((entry) => {
          const slug = entry.get("slug");
          const path = entry.get("path");
          const data = entry.get("data");
          return {
            slug,
            path,
            ...data,
          };
        });
      },
      getAsset: (path) => {
        const asset: any = getAsset(path);
        if (!asset || asset.path === "empty.svg") {
          return path;
        }
        return `${asset.url}#path=${path}`;
      },
      getCollection: (name) => {
        const c = (config as any as CmsConfig<false>).collections.find(
          (c) => c.name === name
        );
        if (!c) {
          throw new Error(`Collection '${name}' not found`);
        }
        return c;
      },
    })
  ).current;
}

function useData(props: PreviewTemplateComponentProps) {
  const { entry, fields } = props;
  const [data, setData] = useState<any>();
  const transform = useTransform(props);
  useEffect(() => {
    transform(entry.get("data"), fields.toJS()).then((value) => {
      value.slug = entry.get("slug");
      setData(value);
    });
  }, [entry, transform, fields]);
  return data;
}

function useDecapLinks(previewDoc: Document) {
  useEffect(() => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor?.href) return;

      const url = new URL(anchor.href);

      // Only handle internal links
      if (url.origin !== window.location.origin) return;

      const previewMatch = url.hash.match(/^#preview=([^/]+)\/(.*)$/);
      if (!previewMatch) return;

      e.preventDefault();

      const [, collection, slug] = previewMatch;
      location.hash = `/collections/${collection}/entries/${slug}`;
      location.reload();
    };

    previewDoc.addEventListener("click", handleClick, { capture: true });
    return () =>
      previewDoc.removeEventListener("click", handleClick, { capture: true });
  }, []);
}

function usePreviewStyles(previewDoc: Document) {
  useEffect(() => {
    const syncStyles = () => {
      const styles = document.head.querySelectorAll("style[data-vite-dev-id]");
      styles.forEach((style) => {
        const existing = previewDoc.querySelector(
          `style[data-vite-dev-id="${style.getAttribute("data-vite-dev-id")}"]`
        );
        if (existing) existing.remove();
        previewDoc.head.appendChild(style.cloneNode(true));
      });
    };

    // Initial sync
    syncStyles();

    // Observe style changes in top document
    const observer = new MutationObserver(() => {
      syncStyles();
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);
}

type PreviewProps = PreviewTemplateComponentProps & {
  layout?: React.ComponentType<any>;
};

export function Preview(props: PreviewProps) {
  useDecapLinks(props.document);
  usePreviewStyles(props.document);

  const data = useData(props);
  if (!data) return null;
  return <div>{props.layout && <props.layout {...data} />}</div>;
}
