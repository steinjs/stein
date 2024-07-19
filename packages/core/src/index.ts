import { createServer, PluginOption as VitePluginOption } from "vite";
import solid from "vite-plugin-solid";
import type { PartialDeep } from "type-fest";
import { defu } from "defu";

export const startDevelopmentServer = async (cwd: string, config: SteinConfig): Promise<void> => {
  let solidIndex = 0;
  const plugins: VitePluginOption = [solid()];

  for (const plugin of config.plugins) {
    // We need to register the plugins that were made for Vite.
    for (const vitePlugin of plugin.extends ?? []) {
      if (!vitePlugin) continue; // skip if false or undefined.

      // position is given, put it in the right place.
      if ("position" in vitePlugin) {
        if (vitePlugin.position === "before-solid") {
          plugins.splice(solidIndex, 0, vitePlugin.plugin);
          solidIndex++;
        }
        else plugins.push(vitePlugin.plugin);
      }
      else plugins.push(vitePlugin);
    }

    if (plugin.vite) {
      plugins.push(plugin.vite);
      console.info("registered a stein main vite plugin for:", plugin.name);
    }
    
    console.info("registered a stein plugin:", plugin.name);
  }
  
  const server = await createServer({
    plugins,
    
    root: cwd,
    clearScreen: false
  });
  
  await server.listen(config.development.port);
  console.info(`Stein running SolidJS at http://localhost:${config.development.port}`);
};

export interface SteinConfig {
  /**
   * Stein plugins to use in the project.
   * @default []
   */
  plugins: Plugin[];

  development: {
    /**
     * The port to run the development server on.
     * @default 3000
     */
    port: number;
  }
}

export const defineConfig = (options: PartialDeep<SteinConfig>): SteinConfig => defu(options, {
  plugins: [],
  development: {
    port: 3000,
  }
} satisfies SteinConfig);

export interface Plugin {
  name: string

  /** Vite plugins involved in this process. */
  extends?: Array<VitePluginOption | {
    /** @default "after-solid" */
    position: "before-solid" | "after-solid",
    plugin: VitePluginOption
  }>
  
  vite?: VitePluginOption
}

/** Helper to have types when making a new plugin. */
export const definePlugin = <T>(plugin: (config?: PartialDeep<T>) => Plugin) => plugin;
