# stein-plugin-unocss

Based on [`@unocss/astro`](https://github.com/unocss/unocss/blob/main/packages/astro) integration.

## Installation

```bash
bun add -D stein-plugin-unocss
npm add -D stein-plugin-unocss
yarn add -D stein-plugin-unocss
pnpm add -D stein-plugin-unocss
```

## Usage

```typescript
import { defineConfig } from "@steinjs/core";
import unocss from "stein-plugin-unocss";

export default defineConfig({
  plugins: [unocss({
    // options, see below
  })]
});
```

If you use `injectReset: true`, make sure to also install `@unocss/reset`:

```bash
bun add @unocss/reset
npm add @unocss/reset
yarn add @unocss/reset
pnpm add @unocss/reset
```

## Options

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `injectEntry` | `boolean` | `true` | Automatically add UnoCSS entry import in the `index.html`. |
| `injectReset` | `boolean \| string` | `false` | When passing `true`, `@unocss/reset/tailwind.css` will be used. |
| `injectExtra` | `string[]` | `[]` | Inject extra imports. |
