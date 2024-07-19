import { definePlugin, type Plugin } from "@steinjs/core";
import unocss from "unocss/vite";
import { defu } from "defu";

interface Config {
  /**
   * Automatically adds the `import "uno.css";`
   * to the entry file.
   * 
   * @default true
   */
  autoImportUno: boolean;
}

const defaultConfiguration: Config = {
  autoImportUno: true
};

export default definePlugin<Config>((userConfiguration) => {
  const config = defu(userConfiguration, defaultConfiguration);
  
  return {
    name: "unocss",
    extends: [{ position: "before-solid", plugin: unocss() }],
    vite: config.autoImportUno ? {
      name: "stein-plugin-unocss",
      transform: (code, id) => {
        if (id.endsWith("index.tsx")) {
          return `import"virtual:uno.css";` + code;
        }
      }
    } : void 0
  } satisfies Plugin;
});
