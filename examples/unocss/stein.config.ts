import unocss from "stein-plugin-unocss";
import {defineConfig} from "@steinjs/core";

// See the documentation for more details.
export default defineConfig({
  plugins: [unocss({
    injectReset: true,
  })],
  development: {
    port: 1234
  }
});
