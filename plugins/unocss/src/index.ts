import { type Plugin, definePlugin } from "@steinjs/core";
import { defu } from "defu";
import unocss from "unocss/vite";

const UNO_INJECT_ID = "__stein@unocss";

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
}

const defaultConfiguration: Config = {
  injectEntry: true,
  injectReset: false,
  injectExtra: [],
};

export default definePlugin<Partial<Config>>((userConfiguration) => {
  const { injectEntry, injectReset, injectExtra } = defu(
    userConfiguration,
    defaultConfiguration,
  );
  const injects = injectExtra;

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
    extends: [{ position: "before-solid", plugin: unocss() }],
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
