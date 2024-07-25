import { type Plugin, definePlugin } from "@steinjs/core";
import autoprefixer from "autoprefixer";
import defu from "defu";

import path from "node:path";
import fs from "node:fs";

import tailwindcss from "tailwindcss";
import type { Config as TailwindConfig } from "tailwindcss";

import { findConfigFile } from "./utils/findConfigFile";
import { loadConfig } from "c12";

const TW_INJECT_ID = "__stein@tailwindcss.css";

type Config = {
  /**
   * A direct way to change your Tailwind config
   * (only recommended if you have a very small config, otherwise please use an external config file)
   */
  config?: Partial<TailwindConfig>;

  /**
   * Override for the path to your Tailwind config file
   *
   * @default "tailwind.config.js"
   * @example "configs/tailwind.config.js"
   */
  configPath?: string;
};

const defaultConfiguration: Config = {
  config: {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  },
  configPath: "tailwind.config.js",
};

export default definePlugin<Config>((userConfiguration) => {
  const mergedSteinConfigs = defu(userConfiguration, defaultConfiguration);

  const localTailwindConfigFile =
    getLocalTailwindConfigFile(mergedSteinConfigs); // We need this for getting back the config file that is used to watch for changes

  return {
    name: "tailwindcss",
    vite: {
      name: "stein:tailwindcss",
      enforce: "pre",

      resolveId(id) {
        if (id === TW_INJECT_ID) return id;
      },

      load(id) {
        if (id.endsWith(TW_INJECT_ID)) {
          return [
            "@tailwind base;",
            "@tailwind components;",
            "@tailwind utilities;",
          ].join("\n");
        }
      },

      config: async () => {
        const twConfigResolved =
          ((await loadTailwindConfig(mergedSteinConfigs)) as TailwindConfig) ??
          defaultConfiguration.config;

        return {
          css: {
            transformer: "postcss",
            postcss: {
              plugins: [autoprefixer(), tailwindcss(twConfigResolved)],
            },
          },
        };
      },

      configureServer(server) {
        server.watcher.add(localTailwindConfigFile ?? []);
        server.watcher.on("add", handleTailwindConfigChange);
        server.watcher.on("change", handleTailwindConfigChange);
        server.watcher.on("unlink", handleTailwindConfigChange);

        function handleTailwindConfigChange(file: string) {
          if (file !== localTailwindConfigFile) return;

          server.restart(); // Full server restart to make sure the config is reloaded
        }
      },

      transformIndexHtml: {
        order: "pre",
        handler: (html) => {
          const endHead = html.indexOf("</head>");
          return (
            // biome-ignore lint: better readability
            html.slice(0, endHead) +
            `<script src="${TW_INJECT_ID}" type="module"></script>` +
            html.slice(endHead)
          );
        },
      },
    },
  } satisfies Plugin;
});

const loadTailwindConfig = async (steinConfigMerged: Config) => {
  const { configFile, cwd } = getLocalConfigInfo(steinConfigMerged);

  // Try to load the local config if any was found
  const { config } = await loadConfig({
    cwd,
    configFile,
  });

  const tailwindConfig = defu(config ?? {}, steinConfigMerged.config);

  return tailwindConfig;
};

const getLocalTailwindConfigFile = (steinConfigMerged: Config) => {
  // Check if file specified by user exists
  const specifiedConfigFound = checkIfFileExists(
    steinConfigMerged.configPath ?? "tailwind.config.js",
  );

  // Use specified config if found, otherwise try to find one in the project folder
  const localTailwindConfigFile = specifiedConfigFound
    ? path.join(process.cwd(), steinConfigMerged.configPath ?? "")
    : findConfigFile(process.cwd());

  return localTailwindConfigFile;
};

const checkIfFileExists = (path: string) => {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const getLocalConfigInfo = (steinConfigMerged: Config) => {
  // Check if file specified by user exists
  const specifiedConfigFound = checkIfFileExists(
    steinConfigMerged.configPath ?? "tailwind.config.js",
  );

  if (!specifiedConfigFound) {
    // If we don't find our custom file, pass a default taiwind.config name for c12 to search for in the project root
    return {
      configFile: "tailwind.config",
      cwd: process.cwd(),
    };
  }

  // Get info about custom config path
  const specifiedConfigPath = path.dirname(
    path.join(process.cwd(), steinConfigMerged.configPath ?? ""),
  );
  const specifiedConfigFileName = path.basename(
    path.join(process.cwd(), steinConfigMerged.configPath ?? ""),
  );

  // Remove file extension from config File name (.ts, .js, .cjs, etc.)
  const specifiedConfigFileNameWithoutExtension = path.basename(
    specifiedConfigFileName,
    path.extname(specifiedConfigFileName),
  );

  return {
    configFile: specifiedConfigFileNameWithoutExtension,
    cwd: specifiedConfigPath,
  };
};
