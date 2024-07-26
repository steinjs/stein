import {
  type InlineConfig as ViteConfig,
  type ViteDevServer,
  type PluginOption as VitePluginOption,
  build as createViteBuild,
  createServer as createViteServer,
} from "vite";

import { defu } from "defu";
import type { PartialDeep } from "type-fest";

import solid from "vite-plugin-solid";

const convertToViteConfig = async (
  cwd: string,
  config: SteinConfig,
): Promise<ViteConfig> => {
  let solidIndex = 0;
  const plugins: VitePluginOption = [solid()];

  for (const pluginPromise of config.plugins) {
    const plugin = await pluginPromise;

    // We need to register the plugins that were made for Vite.
    for (const vitePlugin of plugin.extends ?? []) {
      if (!vitePlugin) continue; // skip if false or undefined.

      // position is given, put it in the right place.
      if ("position" in vitePlugin) {
        if (vitePlugin.position === "before-solid") {
          plugins.splice(solidIndex, 0, vitePlugin.plugin);
          solidIndex++;
        } else plugins.push(vitePlugin.plugin);
      } else plugins.push(vitePlugin);
    }

    if (plugin.vite) plugins.push(plugin.vite);
  }

  return {
    configFile: false,
    plugins,

    root: cwd,
    server: { port: config.development.port, strictPort: true },
    clearScreen: false,
  };
};

export const dev = async (
  cwd: string,
  config: SteinConfig,
): Promise<ViteDevServer> => {
  const server = await createViteServer(await convertToViteConfig(cwd, config));

  await server.listen();
  return server;
};

export const build = async (
  cwd: string,
  config: SteinConfig,
): Promise<void> => {
  await createViteBuild(await convertToViteConfig(cwd, config));
};

export interface SteinConfig {
  /**
   * Stein plugins to use in the project.
   * @default []
   */
  plugins: Promise<Plugin>[];

  development: {
    /**
     * The port to run the development server on.
     * @default 3000
     */
    port: number;
  };
}

export const defineConfig = (options: PartialDeep<SteinConfig>): SteinConfig =>
  defu(options, {
    plugins: [],
    development: {
      port: 3000,
    },
  } satisfies SteinConfig);

export interface Plugin {
  name: string;

  /** Vite plugins involved in this process. */
  extends?: Array<
    | VitePluginOption
    | {
        /** @default "after-solid" */
        position: "before-solid" | "after-solid";
        plugin: VitePluginOption;
      }
  >;

  vite?: VitePluginOption;
}

/** Helper to have types when making a new plugin. */
export const definePlugin = <T>(plugin: (config?: T) => Promise<Plugin>) =>
  plugin;
