import { PluginOption } from "vite";
import capri from "@capri-js/react";
import react from "@vitejs/plugin-react";
import { optimizeLodashImports } from "@optimize-lodash/rollup-plugin";

export interface DecaprioPluginOptions {
  createIndexFiles?: boolean;
  inlineCss?: boolean;
  adminRoute?: string;
}

export function decaprio(options: DecaprioPluginOptions = {}): PluginOption {
  const plugins: PluginOption[] = [];

  plugins.push(react());

  plugins.push(
    capri({
      createIndexFiles: options.createIndexFiles ?? false,
      inlineCss: options.inlineCss ?? true,
      spa: options.adminRoute ?? "/admin",
    })
  );

  plugins.push(optimizeLodashImports() as any);

  plugins.push({
    name: "vite-plugin-decaprio",
    config(config) {
      return {
        resolve: {
          alias: {
            ...(config.resolve?.alias || {}),
            "lodash-es": "lodash",
            "lodash-es/(.*)": "lodash/$1",
          },
        },
      };
    },
  });

  return plugins;
}
