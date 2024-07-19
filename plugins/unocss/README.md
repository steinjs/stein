# stein-plugin-unocss

## Installation

```bash
pnpm add -D stein-plugin-unocss
bun add -D stein-plugin-unocss
```

## Usage

```typescript
import { defineConfig } from "@steinjs/core";
import unocss from "stein-plugin-unocss";

export default defineConfig({
  plugins: [unocss({
    // options
  })]
});
```

## Options

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| autoImportUno | `boolean` | `true` | Automatically add `import "uno.css";` to the entry point. |
