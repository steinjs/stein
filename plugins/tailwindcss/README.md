# stein-plugin-tailwindcss

## Installation

```bash
bun add -D stein-plugin-tailwindcss
npm add -D stein-plugin-tailwindcss
yarn add -D stein-plugin-tailwindcss
pnpm add -D stein-plugin-tailwindcss
```

## Usage

```typescript
import { defineConfig } from "@steinjs/core";
import tailwindcss from "stein-plugin-tailwindcss";

export default defineConfig({
  plugins: [tailwindcss({
    // options, see below
  })]
});
```

## Options

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `configPath` | `string` | `"tailwind.config.js"` | Path to the Tailwind config file, e.g. `"configs/tailwind.config.js"`. |
| `config` | `object` | `{ content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]}` | A direct way to change your Tailwind config (only recommended if you have a very small config, otherwise please use an external config file) |
