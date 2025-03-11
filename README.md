# Decaprio 🍸

A typesafe I/O layer for [Decap CMS](https://decapcms.org) that provides full-page live previews with visual editing and a focus on developer experience.

## Features

- **Type-safe API**: Infer component props from Decap collection definitions
- **React Integration**: Use the same components for both server-side rendering and live previews inside the CMS
- **Content Transformation**: Built-in utilities for loading and transforming content

## Installation

```bash
npm install decaprio
```

## Defining Collections

Use the `collection` function to define a collection. It serves two purposes:

1. It enforces correct typings in your configuration
2. It returns the configuration as a const type, allowing Decaprio to infer its type

```tsx
// src/collections/posts.ts

import { collection } from "decaprio";

export default collection({
  name: "posts",
  label: "Blog Posts",
  folder: "content/posts",
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

## Working with Blocks

Blocks are reusable parts that can be used to create page-builder-like experiences.

First, add this to your `src/collections/index.ts` file where you define the registry:

```ts
import { InferBlock } from "decaprio";
export type BlockProps<T> = InferBlock<T, typeof registry>;
```

Now you can create a block:

```tsx
// src/blocks/Text.ts
import { block, field } from 'decaprio';
import { InferBlock } from '../collections';

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
function TextBlock(props: InferBlock<typeof config>) {
  return <p>{props.content}</p>;
}

export default block(config, TextBlock);
```

We now need to collect all blocks in a similar way we did with the collections. Create a file `src/blocks/index.ts` like this:

```tsx
import text from "./text";
import image from "./image";

export const { types, Blocks } = blocks(text, image);
```

The `blocks` function returns an object with two properties:

- `types`: An array of block configurations to use in a collection definition
- `Blocks`: A React component that renders the appropriate block component based on the data

Lets create a `pages` collection that uses the blocks we defined:

```tsx
// src/collections/pages.ts

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

## Configure Decap CMS

Let's assume we we use a Vite-based setup. In this case we can initialize Decap like this:

```tsx
// src/main.tsx

import { init } from "decaprio/decap";
import { registry } from "./collections";
import css from "./styles.css?inline";

init({
  registry,
  css, // In Vite, ?inline imports the CSS as string
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

The `init` function takes care of registering the full-page previews and requires:

- Your registry of collections and layouts
- Your CSS inlined as a string (with Vite, you can use the `?inline` suffix)
- A standard Decap CMS configuration (without the collections, as they come from the registry)

> **NOTE:**
> Decaprio currently bundles a forked version of Decap CMS with improved ESM and TypeScript support. We are actively working
> on getting these changes merged upstream.

## Server-side Rendering

Decaprio provides a Vite plugin that lets you generate static pages with [Capri](https://capri.build):

```tsx
// vite.config.ts

import { defineConfig } from "vite";
import { decaprio } from "decaprio/vite";
import tailwindcss from "@tailwindcss/vite";
import { registry } from "./src/collections";

export default defineConfig({
  plugins: [
    decaprio({
      registry,
      adminRoute: "/admin",
      createIndexFiles: false,
      inlineCss: true,
    }),
    tailwindcss(),
  ],
});
```

In addition to the `src/main.tsx` entry file we created above, we need a second one right next to it called `main.server.tsx` that handles the generation of the static pages:

```tsx
// src/main.server.tsx

import { registry } from "./collections";
import { createRenderFunction } from "decaprio/server";
import "./main.css";

export const render = createRenderFunction(registry);
```

## Using other SSR tools

While Decaprio was built with Capri in mind, it can be used with any suitable tool or framework that supports server-side rendering. In Next.js it would roughly look like this:

```tsx
import { Content } from "decaprio/server";
import { registry } from "./collections";

const content = new Content(registry);

// Use with your preferred SSR framework

export async function getStaticPaths() {
  const paths = await content.listAllPaths();
  return paths.map((path) => ({ params: { slug: path } }));
}

export async function getStaticProps({ params }) {
  const content = await content.resolve(`/${params.slug}`);
  return { props: { content } };
}
```

## License

MIT
