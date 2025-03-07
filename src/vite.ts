import { PluginOption } from 'vite';
import capri from '@capri-js/react';
import react from '@vitejs/plugin-react';
import { optimizeLodashImports } from '@optimize-lodash/rollup-plugin';
import { CollectionRegistry } from './registry';
import { listAllPaths } from './server';

export interface DecaprioPluginOptions {
  registry: CollectionRegistry;
  createIndexFiles?: boolean;
  inlineCss?: boolean;
  adminRoute?: string;
}

export function decaprio(options: DecaprioPluginOptions): PluginOption[] {
  const plugins: PluginOption[] = [];
  
  plugins.push(react());
  
  // Add Capri plugin with Decaprio integration
  plugins.push(
    capri({
      createIndexFiles: options.createIndexFiles ?? false,
      inlineCss: options.inlineCss ?? true,
      prerender: () => listAllPaths(options.registry),
      spa: options.adminRoute ?? '/admin',
    })
  );
  
  plugins.push(optimizeLodashImports() as any);
  
  plugins.push({
    name: 'vite-plugin-decaprio',
    config(config) {
      return {
        resolve: {
          alias: {
            ...(config.resolve?.alias || {}),
            "lodash-es": "lodash",
            "lodash-es/(.*)": "lodash/$1",
            // Ensure Decap CMS fork is used
            "decap-cms-app": "@fgnass/decap-cms-app",
            "decap-cms-core": "@fgnass/decap-cms-core",
          },
        },
      };
    },
  });
  
  return plugins;
}
