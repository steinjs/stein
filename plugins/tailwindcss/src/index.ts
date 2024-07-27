import {
  type Plugin,
  definePlugin,
  waitToAddToWatcher,
  readConfigurationScript,
  findConfigurationScript,
  findConfigurationScriptFullPath,
} from "@steinjs/core";

import autoprefixer from "autoprefixer";
import defu from "defu";

import tailwindcss from "tailwindcss";
import type { Config as TailwindConfig } from "tailwindcss";
export type { TailwindConfig };

const TW_INJECT_ID = "__stein@tailwindcss.css";
const TW_DEFAULT_CONFIG_NAME = "tailwind.config";
const TW_DEFAULT_CONFIG_PATH = TW_DEFAULT_CONFIG_NAME + ".js";

interface Config {
  /**
   * A direct way to change your Tailwind config
   * (only recommended if you have a very small config, otherwise please use an external config file)
   */
  config: Partial<TailwindConfig>;

  /**
   * Override for the path to your Tailwind config file
   *
   * @default "tailwind.config.js"
   * @example "configs/tailwind.config.js"
   */
  configPath: string;
}

const defaultConfiguration: Config = {
  config: {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  },
  configPath: TW_DEFAULT_CONFIG_PATH,
};

export default definePlugin<Partial<Config>>(
  (userConfiguration) => async () => {
    const pluginConfig = defu(userConfiguration, defaultConfiguration);

    const tailwindConfigFilePath = findConfigurationScriptFullPath(
      pluginConfig.configPath,
      TW_DEFAULT_CONFIG_NAME,
    );

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
          const tailwindConfig = await readTailwindConfig(
            pluginConfig.configPath,
            // should merge with inlined config
            <TailwindConfig>pluginConfig.config,
          );

          return {
            css: {
              transformer: "postcss",
              postcss: {
                plugins: [autoprefixer(), tailwindcss(tailwindConfig)],
              },
            },
          };
        },

        configureServer: async (server) => {
          if (!tailwindConfigFilePath) return;
          waitToAddToWatcher([tailwindConfigFilePath], server);
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
  },
);

const readTailwindConfig = async (
  configPath = TW_DEFAULT_CONFIG_PATH,
  inlineConfig: TailwindConfig,
): Promise<TailwindConfig> => {
  const { cwd, configName } = findConfigurationScript(
    configPath,
    TW_DEFAULT_CONFIG_NAME,
  );

  return readConfigurationScript(cwd, configName, inlineConfig);
};
