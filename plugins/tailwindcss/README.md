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

> For now, there's no options available. We're trying to see what would be the best way to configure TailwindCSS in Stein. If you have any suggestions, feel free to open an issue or a pull request.
