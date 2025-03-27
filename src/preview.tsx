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

function useDecapLinks(doc: Document) {
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

    doc.addEventListener("click", handleClick, { capture: true });
    return () =>
      doc.removeEventListener("click", handleClick, { capture: true });
  }, []);
}

type PreviewProps = PreviewTemplateComponentProps & {
  layout?: React.ComponentType<any>;
  css?: string;
};

export function Preview(props: PreviewProps) {
  useDecapLinks(props.document);
  const data = useData(props);
  if (!data) return null;
  return (
    <div>
      <style>{props.css}</style>
      {props.layout && <props.layout {...data} />}
    </div>
  );
}
