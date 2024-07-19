import { defineConfig } from "@steinjs/core";
import unocss from "stein-plugin-unocss";

export default defineConfig({
  plugins: [unocss({ injectReset: true })],
  
  development: {
    port: 1234
  }
});
