import {
  type InlineConfig as ViteConfig,
  type ViteDevServer,
  type PluginOption as VitePluginOption,
  build as createViteBuild,
  createServer as createViteServer,
  normalizePath,
} from "vite";

import { defu } from "defu";
import type { PartialDeep } from "type-fest";

import solid from "vite-plugin-solid";
export * from "./utils";

export interface Container {
  vite: SteinDevServer;
  config: SteinConfig;
  restartInFlight: boolean;
  close: () => Promise<void>;
}

export const createContainer = async (
  cwd: string,
  config: SteinConfig,
): Promise<Container> => {
  const viteConfig = await convertToViteConfig(cwd, config);
  const vite = (await createViteServer(viteConfig)) as SteinDevServer;

  const container: Container = {
    vite,
    config,
    restartInFlight: false,
    close() {
      return closeContainer(container);
    },
  };

  return container;
};

export const closeContainer = async ({ vite }: Container) => {
  await vite.close();
};

export const startContainer = async ({ vite, config }: Container) => {
  await vite.listen(config.development.port);
  const addr = `http://localhost:${config.development.port}`;
  console.log("listening on", addr); // TODO: make this better ?

  return addr;
};

const STEIN_CONFIG_RE = /.*stein.config.(?:mjs|cjs|js|ts)$/;
export function shouldRestartContainer(
  watchFiles: string[],
  restartInFlight: boolean,
  changedFile: string,
): boolean {
  if (restartInFlight) return false;
  const normalizedChangedFile = normalizePath(changedFile);

  // is handled manually in the CLI.
  if (STEIN_CONFIG_RE.test(normalizedChangedFile)) return false;

  return watchFiles.some(
    (path) => normalizePath(path) === normalizedChangedFile,
  );
}

async function createRestartedContainer(
  cwd: string,
  container: Container,
): Promise<Container> {
  const { config } = container;
  const newContainer = await createContainer(cwd, config);

  await startContainer(newContainer);
  return newContainer;
}

export async function restartContainer(
  cwd: string,
  container: Container,
): Promise<Container | Error> {
  container.restartInFlight = true;

  try {
    await container.close();
    return await createRestartedContainer(cwd, container);
  } catch (_err) {
    console.error("an error happened", _err);
    container.restartInFlight = false;
    return _err as Error;
  }
}

interface Restart {
  container: Container;
  restarted: () => Promise<Error | null>;
}

export type SteinDevServer = ViteDevServer & {
  stein?: {
    restart: () => Promise<void>;
    watcher: {
      add: (pattern: string) => void;
    };
  };
};

export const createContainerWithAutomaticRestart = async (
  cwd: string,
  config: SteinConfig,
): Promise<Restart> => {
  const initialContainer = await createContainer(cwd, config);
  let resolveRestart: (value: Error | null) => void;
  let restartComplete = new Promise<Error | null>((resolve) => {
    resolveRestart = resolve;
  });

  let watchFiles: string[] = [];

  const restart: Restart = {
    container: initialContainer,
    restarted() {
      return restartComplete;
    },
  };

  async function handleServerRestart(logMsg = "") {
    console.info(`${logMsg} Restarting...`.trim());
    const container = restart.container;
    watchFiles = []; // reset, will be filled at restart.

    const result = await restartContainer(cwd, container);
    if (result instanceof Error) {
      // Failed to restart, use existing container
      resolveRestart(result);
    } else {
      // Restart success. Add new watches because this is a new container with a new Vite server
      restart.container = result;
      setupContainer();
      resolveRestart(null);
    }
    restartComplete = new Promise<Error | null>((resolve) => {
      resolveRestart = resolve;
    });
  }

  function handleChangeRestart(logMsg: string) {
    return async (changedFile: string) => {
      if (
        shouldRestartContainer(
          watchFiles,
          restart.container.restartInFlight,
          changedFile,
        )
      ) {
        handleServerRestart(logMsg);
      }
    };
  }

  // Set up watchers, vite restart API, and shortcuts
  function setupContainer() {
    const watcher = restart.container.vite.watcher;
    watcher.on("change", handleChangeRestart("config file updated."));
    watcher.on("unlink", handleChangeRestart("config file removed."));
    watcher.on("add", handleChangeRestart("config file added."));

    // Restart the Stein dev server instead of Vite's when the API is called by plugins.
    // Ignore the `forceOptimize` parameter for now.
    restart.container.vite.stein = {
      restart: handleServerRestart,
      watcher: {
        add: (pattern) => void watchFiles.push(pattern),
      },
    };

    // Set up shortcuts, overriding Vite's default shortcuts so it works for Astro
    restart.container.vite.bindCLIShortcuts({
      customShortcuts: [
        // Disable Vite's builtin "r" (restart server), "u" (print server urls) and "c" (clear console) shortcuts
        { key: "r", description: "" },
        { key: "u", description: "" },
        { key: "c", description: "" },
      ],
    });
  }
  setupContainer();
  return restart;
};

export const convertToViteConfig = async (
  cwd: string,
  config: SteinConfig,
): Promise<ViteConfig> => {
  let solidIndex = 0;
  const plugins: VitePluginOption = [solid()];

  for (const createPlugin of config.plugins) {
    const plugin = await createPlugin();

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

export const dev = async (cwd: string, config: SteinConfig) => {
  const restart = await createContainerWithAutomaticRestart(cwd, config);
  const devServerAddressInfo = await startContainer(restart.container);

  return {
    address: devServerAddressInfo,
    get container() {
      return restart.container;
    },
  };
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
  plugins: Array<() => Promise<Plugin> | Plugin>;

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
export const definePlugin = <T>(
  plugin: (config?: T) => () => Promise<Plugin> | Plugin,
) => plugin;
