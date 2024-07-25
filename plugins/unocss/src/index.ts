import { type Plugin, definePlugin } from "@steinjs/core";
import fs from "node:fs";
import path from "node:path";

import { defu } from "defu";
import { loadConfig } from "c12";
import { findConfigFile } from "./utils/findConfigFile";

import unocss from "unocss/vite";
import type { UserConfig } from "unocss";

export { defineConfig } from "unocss";

const UNO_INJECT_ID = "__stein@unocss";

interface Config {
  /**
   * Automatically add UnoCSS entry import in the `index.html`
   *
   * @default true
   */
  injectEntry?: boolean;

  /**
   * Include reset styles.
   * When passing `true`, `@unocss/reset/tailwind.css` will be used
   *
   * @default false
   * @example "@unocss/reset/normalize.css"
   */
  injectReset?: boolean | string;

  /**
   * Inject extra imports.
   *
   * @default []
   */
  injectExtra?: string[];

  /**
   * A direct way to change your UnoCSS config
   * (only recommended if you have a very small config, otherwise please use an external config file)
   */
  config?: Partial<UserConfig>;

  /**
   * Override for the path to your UnoCSS config file
   *
   * @default "uno.config.ts"
   * @example "configs/uno.config.ts"
   */
  configPath?: string;
}

const defaultConfiguration: Config = {
  injectEntry: true,
  injectReset: false,
  injectExtra: [],
  configPath: "uno.config.ts",
  config: {},
};

export default definePlugin<Config>((userConfiguration) => {
  const steinConfigMerged = defu(
    userConfiguration,
    defaultConfiguration,
  ) as Config;
  const { injectEntry, injectReset, injectExtra } = steinConfigMerged;
  const injects = injectExtra ?? [];

  if (injectReset) {
    const resetPath =
      typeof injectReset === "string"
        ? injectReset
        : "@unocss/reset/tailwind.css";

    injects.push(`import ${JSON.stringify(resetPath)}`);
  }

  if (injectEntry) {
    injects.push('import "uno.css"');
  }

  return {
    name: "unocss",
    extends: [
      {
        position: "before-solid",
        plugin: unocss(loadUnoConfig(steinConfigMerged)),
      },
    ],
    vite: {
      name: "stein:unocss",
      enforce: "pre",

      resolveId(id) {
        if (id === UNO_INJECT_ID) return id;
      },

      load(id) {
        if (id.endsWith(UNO_INJECT_ID)) return injects.join("\n");
      },

      transformIndexHtml: {
        enforce: "pre",
        handler: (html) => {
          const endHead = html.indexOf("</head>");
          return (
            // biome-ignore lint: better readability
            html.slice(0, endHead) +
            `<script src="${UNO_INJECT_ID}" type="module"></script>` +
            html.slice(endHead)
          );
        },
      },
    },
  } satisfies Plugin;
});

const loadUnoConfig = (steinConfigMerged: Partial<Config>) => {
  const { configFile, cwd } = getLocalConfigInfo(steinConfigMerged);

  // Try to load the local config if any was found
  loadConfig({
    cwd,
    configFile,
  }).then((cfg) => {
    const config = cfg.config;

    const tailwindConfig = defu(config ?? {}, steinConfigMerged.config);

    console.log("POPOAWKDPOKAWD");

    return tailwindConfig;
  });

  return steinConfigMerged.config;
};

const getLocalTailwindConfigFile = (steinConfigMerged: Partial<Config>) => {
  // Check if file specified by user exists
  const specifiedConfigFound = checkIfFileExists(steinConfigMerged.configPath);

  // Use specified config if found, otherwise try to find one in the project folder
  const localTailwindConfigFile = specifiedConfigFound
    ? path.join(process.cwd(), steinConfigMerged.configPath ?? "")
    : findConfigFile(process.cwd());

  return localTailwindConfigFile;
};

const checkIfFileExists = (path: string | undefined) => {
  if (!path) return false;

  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const getLocalConfigInfo = (steinConfigMerged: Partial<Config>) => {
  // Check if file specified by user exists
  const specifiedConfigFound = checkIfFileExists(steinConfigMerged.configPath);

  if (!specifiedConfigFound) {
    // If we don't find our custom file, pass a default taiwind.config name for c12 to search for in the project root
    return {
      configFile: "uno.config",
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
