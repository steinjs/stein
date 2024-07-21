import { type Plugin, definePlugin } from "@steinjs/core";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

const TW_INJECT_ID = "__stein@tailwindcss.css";

type Config = object;

export default definePlugin<Config>(() => {
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

      config: () => ({
        css: {
          transformer: "postcss",
          postcss: {
            plugins: [
              autoprefixer(),
              tailwindcss({
                content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
              }),
            ],
          },
        },
      }),

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
