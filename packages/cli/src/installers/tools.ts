import fs from "node:fs/promises";
import { createFileWithContent } from "../utils/createFileWithContent";
import { updatePackageJSON } from "../utils/updatePackageJSON";

export const AVAILABLE_TOOLS = [
  "biome",
  "eslint",
  "prettier",
  "eslint-prettier", // Special case where both ESLint and Prettier are installed
];

const eslintTypeScriptDeps = ["@typescript-eslint/parser"];

export const installSteinTool = async (
  tool: string,
  projectDir: string,
  typeScriptEnabled: boolean,
) => {
  if (!AVAILABLE_TOOLS.includes(tool)) {
    throw new Error(`Tool ${tool} is not a valid stein plugin`);
  }

  // TODO: Cancel the process if tool is already installed

  switch (tool) {
    case "eslint":
      createFileWithContent(
        projectDir,
        "eslint.config.js",
        await getEslintConfig(typeScriptEnabled, false),
      );
      await addDevDepdendenciesToPackageJson(projectDir, [
        "eslint",
        "eslint-plugin-solid",
        ...(typeScriptEnabled ? eslintTypeScriptDeps : []),
      ]);
      break;

    case "eslint-prettier":
      console.log("WE ARE INSIDE ESLINT-PRETTIER WOOOOO");
      createFileWithContent(
        projectDir,
        "eslint.config.js",
        await getEslintConfig(typeScriptEnabled, true),
      );

      createFileWithContent(
        projectDir,
        "prettier.config.js",
        await getPrettierConfig(),
      );

      await addDevDepdendenciesToPackageJson(projectDir, [
        "eslint",
        "eslint-plugin-solid",
        "eslint-config-prettier",
        ...(typeScriptEnabled ? eslintTypeScriptDeps : []),
        "prettier",
      ]);
      break;

    case "prettier":
      createFileWithContent(
        projectDir,
        "prettier.config.js",
        await getPrettierConfig(),
      );

      await addDevDepdendenciesToPackageJson(projectDir, ["prettier"]);
      break;

    case "biome":
      createFileWithContent(projectDir, "biome.json", await getBiomeConfig());

      await addDevDepdendenciesToPackageJson(projectDir, ["biome"]);
      break;
  }
};

const addDevDepdendenciesToPackageJson = async (
  projectDir: string,
  dependencies: string[],
) => {
  await updatePackageJSON(projectDir, async (pkg) => {
    for (const dep of dependencies) {
      pkg.devDependencies[dep] = "latest";
    }
  });
};

const getEslintConfig = async (
  typescriptEnabled: boolean,
  prettierEnabled: boolean,
) => {
  if (typescriptEnabled) {
    return `
import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/typescript";
import * as tsParser from "@typescript-eslint/parser";
${prettierEnabled ? `import eslintConfigPrettier from "eslint-config-prettier";` : ""}

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ...solid,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "tsconfig.json",
      },
    },
  },
  ${prettierEnabled ? "eslintConfigPrettier" : ""}
];
`;
  }

  return `
import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/recommended";
${prettierEnabled ? `import eslintConfigPrettier from "eslint-config-prettier";` : ""}

export default [
  js.configs.recommended,
  solid,
  ${prettierEnabled ? "eslintConfigPrettier" : ""}
];
`;
};

const getPrettierConfig = async () => {
  return `
/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: "es5",
  tabWidth: 4,
  semi: false,
  singleQuote: true,
};

export default config;
`;
};

const getBiomeConfig = async () => {
  return `
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "formatter": {
    "enabled": false
  },
  "linter": {
    "enabled": true
  },
  "organizeImports": {
    "enabled": true
  }
}
`;
};
