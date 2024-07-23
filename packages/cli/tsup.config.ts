import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  minify: "terser",
  target: "esnext",
  outDir: "dist",
  dts: true,
});
