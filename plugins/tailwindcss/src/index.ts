import { definePlugin, type Plugin } from "@steinjs/core";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

const TW_INJECT_ID = "__stein@tailwindcss.css";

interface Config {
  // TODO
}

export default definePlugin<Config>(() => {
  return {
    name: "tailwindcss",
    vite: {
      name: "stein:tailwindcss",
      enforce: "pre",
      
      resolveId (id) {
        if (id === TW_INJECT_ID)
          return id;
      },

      load (id) {
        if (id.endsWith(TW_INJECT_ID)) {
          return [
            "@tailwind base;",
            "@tailwind components;",
            "@tailwind utilities;"
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
                content: [
                  "./index.html",
                  "./src/**/*.{js,ts,jsx,tsx}",
                ]
              })
            ]
          }
        }
      }),

      transformIndexHtml (html) {
        const endHead = html.indexOf("</head>") + "</head>".length;
        return html.slice(0, endHead) + `<script src="${TW_INJECT_ID}" type="module"></script>` + html.slice(endHead);
      }
    }
  } satisfies Plugin;
})