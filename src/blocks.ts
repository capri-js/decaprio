import { createElement } from "react";
import { ObjectField } from "./decap-types";

export type Block<T extends ObjectField = any> = {
  config: T;
  component: any;
};

type BlocksProps<T extends ObjectField> = {
  data: { type: T["name"] }[];
};

export function createBlocksComponent<B extends Block[]>(blocks: B) {
  const components: Record<string, any> = {};
  blocks.forEach((block) => {
    components[block.config.name] = block.component;
  });

  return function BlocksComponent({ data }: BlocksProps<B[number]["config"]>) {
    return data.map(({ type, ...props }, key) => {
      const component = components[type];
      if (!component) {
        console.warn(`Unknown block type: ${type}`);
        return null;
      }
      return createElement(component, { key, ...props });
    });
  };
}
