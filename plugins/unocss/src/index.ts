import {
  type Plugin,
  definePlugin,
  findConfigurationScript,
  findConfigurationScriptFullPath,
  readConfigurationScript,
  waitToAddToWatcher,
} from "@steinjs/core";

import { defu } from "defu";

import unocss from "unocss/vite";
import type { UserConfig as UnoConfig } from "unocss";

// Re-export to prevent users to install
// unocss dependency in their project
// for `uno.config.ts`.
export * from "unocss";

const UNO_INJECT_ID = "__stein@unocss";
const UNO_DEFAULT_CONFIG_NAME = "uno.config";
// biome-ignore lint/style/useTemplate: <explanation>
const UNO_DEFAULT_CONFIG_PATH = UNO_DEFAULT_CONFIG_NAME + ".ts";

interface Config {
  /**
   * Automatically add UnoCSS entry import in the `index.html`
   *
   * @default true
   */
  injectEntry: boolean;

  /**
   * Include reset styles.
   * When passing `true`, `@unocss/reset/tailwind.css` will be used
   *
   * @default false
   * @example "@unocss/reset/normalize.css"
   */
  injectReset: boolean | string;

  /**
   * Inject extra imports.
   *
   * @default []
   */
  injectExtra: string[];

  /**
   * A direct way to change your UnoCSS config
   * (only recommended if you have a very small config, otherwise please use an external config file)
   */
  config: Partial<UnoConfig>;

  /**
   * Override for the path to your UnoCSS config file
   *
   * @default "uno.config.ts"
   * @example "configs/uno.config.ts"
   */
  configPath: string;
}

const defaultConfiguration: Config = {
  injectEntry: true,
  injectReset: false,
  injectExtra: [],
  configPath: UNO_DEFAULT_CONFIG_PATH,
  config: {},
};

export default definePlugin<Partial<Config>>(
  (userConfiguration) => async () => {
    const pluginConfig = defu(userConfiguration, defaultConfiguration);

    const { injectEntry, injectReset, injectExtra } = pluginConfig;
    const injects = injectExtra ?? [];

    const unoConfigFilePath = findConfigurationScriptFullPath(
      pluginConfig.configPath,
      UNO_DEFAULT_CONFIG_NAME,
    );

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
          plugin: unocss(
            await readUnoConfig(
              pluginConfig.configPath,
              // should merge with inlined config
              <UnoConfig>pluginConfig.config,
            ),
          ),
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

        configureServer: async (server) => {
          if (!unoConfigFilePath) return;
          waitToAddToWatcher([unoConfigFilePath], server);
        },

        transformIndexHtml: {
          order: "pre",
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
  },
);

const readUnoConfig = async (
  // biome-ignore lint/style/useDefaultParameterLast: <explanation>
  configPath = UNO_DEFAULT_CONFIG_PATH,
  inlineConfig: UnoConfig,
): Promise<UnoConfig> => {
  const { cwd, configName } = findConfigurationScript(
    configPath,
    UNO_DEFAULT_CONFIG_NAME,
  );

  return readConfigurationScript(cwd, configName, inlineConfig);
};
