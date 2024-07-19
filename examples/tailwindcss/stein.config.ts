import { defineConfig } from "@steinjs/core";
import tailwindcss from "stein-plugin-tailwindcss"

export default defineConfig({
  plugins: [tailwindcss()],
  
  development: {
    port: 3000
  }
});
