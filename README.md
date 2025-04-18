# Decaprio 🍸

A type-safe I/O layer for [Decap CMS](https://decapcms.org) that provides full-page live previews with visual editing and a focus on developer experience.

## Features

- **Type-safe API**: Infer component props from Decap collection definitions
- **React Integration**: Use the same components for both server-side rendering and live previews inside the CMS
- **Content Transformation**: Built-in utilities for loading and transforming content

## Quick Start

The easiest way to get started is to use Decaprio with [Capri](https://capri.build) and use the `decap` starter template:

```bash
npm init capri@next my-capri-site decap
```

It will bootstrap a lightweight example project that closely matches the structure outlined in this README.

## Manual Setup

If you want to use a framework other than Capri or manually add Decaprio to an existing project follow these steps:

```bash
npm install decaprio
```

## Defining Collections

Use the `collection` function to define a collection. It serves two purposes:

1. It enforces correct typings in your configuration
2. It returns the configuration as a const type, allowing Decaprio to infer its type
3. It applies sensible defaults:

For folder collections:
* folder: `content/${name}`
* slug: `{{slug}}`
* create: `true`
* extension: `md` if there is a markdown `body` field, `yml` otherwise

For collection files:
* path: `content/${collection.name}/${name}.${extension}`

> **NOTE:**
> The extension is determined the same way as for folder collections

```tsx
// src/collections/posts.ts

import { collection } from "decaprio";

export default collection({
  name: "posts",
  label: "Blog Posts",
  fields: [
    {
      name: "title",
      label: "Title",
      widget: "string",
      required: true,
    },
    {
      name: "date",
      label: "Publish Date",
      widget: "datetime",
    },
    {
      name: "body",
      label: "Body",
      widget: "markdown",
    },
  ],
});
```

## Creating a Registry

Next we need a place where we can collect all our collections. This can be done with the `collections` function which creates a `CollectionRegistry`:

```tsx
// src/collections/index.ts

import { collections } from "decaprio";

import posts from "./posts";
import pages from "./pages";
import settings from "./settings";

// Register all our collections
export const registry = collections(posts, pages, settings);

// Provide a utility type for type-safe components
export type CollectionProps<T> = InferCollection<T, typeof registry>;
```

See the `CollectionProps` that gets exported in the last step? We can use it to create type-safe components to render the content of our collections.

## Type-safe Layout Components

```tsx
// src/collections/posts.ts

import { collection, layout } from "decaprio";
import { CollectionProps } from ".";

// Define a collection
const posts = collection({
  name: "posts",
  label: "Blog Posts",
  folder: "content/posts",
  fields: [
    {
      name: "title",
      label: "Title",
      widget: "string",
    },
    {
      name: "content",
      label: "Content",
      widget: "text",
    },
  ],
});

// Layout component to render a post
function PostLayout({ title, content }: CollectionProps<typeof posts>) {
  return (
    <article>
      <h1>{title}</h1>
      <div>{content}</div>
    </article>
  );
}

// Associate the collection with the layout component
export default layout(posts, PostLayout);
```

The `layout` function associates a collection with a React component, allowing you to register both with the registry. This is optional - you can register collections without layouts for settings or content that only gets embedded into other pages.

For File Collections, you need to pass an object instead with the `name` of each file as key, for which you want to provide a layout:

```tsx
export default layout(pages, {
  home: HomeLayout,
  about: AboutLayout,
});
```


## Working with Blocks

Blocks are reusable parts that can be used to create page-builder-like experiences.

First, add this to your `src/collections/index.ts` file where you define the registry:

```ts
import { InferBlock } from "decaprio";
export type BlockProps<T> = InferBlock<T, typeof registry>;
```

With this `BlockProps` utility type we can infer the props from the block's field config:

```tsx
// src/blocks/Text.ts
import { block, field } from 'decaprio';
import { BlockProps } from '../collections';

// Define a text block configuration
const config = field({
  name: 'text',
  label: 'Text',
  widget: 'object',
  fields: [
    {
      name: 'content',
      label: 'Content',
      widget: 'text',
    }
  ]
};

// Create a type-safe component
function TextBlock(props: BlockProps<typeof config>) {
  return <p>{props.content}</p>;
}

export default block(config, TextBlock);
```

We now need to collect all blocks similarly as we did with the collections. Create a file `src/blocks/index.ts` like this:

```tsx
import text from "./text";
import image from "./image";

export const { types, Blocks } = blocks(text, image);
```

The `blocks` function returns an object with two properties:

- `types`: An array of block configurations to use in a collection definition
- `Blocks`: A React component that renders the appropriate block component based on the data

Let's create a `pages` collection that uses the blocks we defined:

```tsx
// src/collections/pages.ts

import { types, Blocks } from "../blocks";

const config = collection({
  name: "pages",
  label: "Pages",
  folder: "content/pages",
  fields: [
    {
      name: "title",
      label: "Title",
      widget: "string",
    },
    {
      name: "content",
      label: "Content Blocks",
      widget: "list",
      types, // <-- types imported from blocks/index.ts
    },
  ],
});

// Use the Blocks component to render the content
function PageLayout({ title, content }: CollectionProps<typeof config>) {
  return (
    <div>
      <h1>{title}</h1>
      <Blocks data={content} />
    </div>
  );
}

export default layout(config, PageLayout);
```

## Custom components inside Markdown content

Decap support custom components inside its Markdown editor, so called _Editor Components_. Decaprio takes care of automatically serializing and de-serializing them as custom HTML tags and infers the proper types from the `fields` definition. It also provides a `<Markdown />` component to render Markdown content as JSX, including all the custom components.

### 1. Create custom Editor Components

```tsx
// /markdown/LinkButton.tsx

import { editorComponent } from "decaprio";

export default editorComponent({
  id: "LinkButton",
  label: "Link Button",
  fields: [
    {
      name: "label",
      label: "Label",
      widget: "string",
    },
    {
      name: "link",
      label: "Link",
      widget: "string",
    },
  ],
  toPreview: ({ label, link }) => (
    <a href={link} className="rounded bg-primary text-white">
      {label}
    </a>
  ),
});
```

### 2. Create a `<Markdown />` component to render them

```tsx
// /markdown/index.ts

import { markdown } from "decaprio";
import linkButton from "./LinkButton";

export const editorComponents = [linkButton];
const options = {
  // See https://www.npmjs.com/package/markdown-to-jsx
};
export const Markdown = markdown(editorComponents, options);
```

### 3. Register the components with Decap

The last step is to register the components with Decap. This can be done by passing them to the `init` function of Decaprio as shown in the next chapter.

## Configure Decap CMS

Let's assume we use a Vite-based setup. In this case we can initialize Decap like this:

```tsx
// src/main.tsx

import { init } from "decaprio/decap";
import { registry } from "./collections";
import { editorComponents } from "./markdown";

import "./styles.css";

init({
  registry,
  editorComponents,
  config: {
    // Standard Decap config without the collections
    backend: {
      name: "git-gateway",
      branch: "main",
    },
    media_folder: "public/images",
    public_folder: "/images",
  },
});
```

The `init` function takes care of registering the full-page previews and accepts the following options:

- Your registry of collections and layouts
- Your custom Editor Components (optional)
- A standard Decap CMS configuration (without the collections, as they come from the registry)

> **NOTE:**
> Decaprio currently bundles a forked version of Decap CMS with improved ESM and TypeScript support. We are actively working
> on getting these changes merged upstream.

## Server-side Rendering

The easiest and most lightweight way to render static HTML pages is by using [Capri](https://capri.build). All we need to do is to create a `src/main.server.tsx` file right next to the `src/main.tsx` file we created above:

```tsx
// src/main.server.tsx

import { registry } from "./collections";
import { ssr } from "decaprio/static";
import "./main.css";

export const { render, getStaticPaths } = ssr(registry);
```

## Using other SSR tools

While Decaprio was built with Capri in mind, it can be used with any suitable tool or framework that supports server-side rendering. In Next.js it would look like this:

```tsx
// app/[[...slug]]/page.tsx

import { Content } from "decaprio/server";
import { registry } from "@/collections";

import "@/main.css";

const content = new Content(registry);

type PageParams = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function generateStaticParams() {
  const paths = await content.listAllPaths();
  return paths.map((path) => ({ slug: path.split("/") }));
}

export default async function Page({ params }: PageParams) {
  const { slug = [] } = await params;
  const path = `/${slug.join("/")}`;
  const children = await content.resolve(path);
  return <>{children}</>;
}
```

And a second page to render the Decap UI:

```tsx
// app/admin/page.tsx

import { Client } from "./client";

import "@/main.css";

export default function Page() {
  return <Client />;
}
```

As Decap needs to be rendered in the client, we need to create a _client component_:

```tsx
// app/admin/client.tsx

"use client";

import { init } from "decaprio/decap";
import IconWidget from "decap-cms-widget-iconify";

import { registry } from "@/collections";
import { editorComponents } from "@/markdown";
import { useEffect } from "react";

export function Client() {
  useEffect(() => {
    init({
      registry,
      editorComponents,
      config: {
        // Regular Decap config ...
      },
    });
  }, []);
  return null;
}
```

## License

MIT
