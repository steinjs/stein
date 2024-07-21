import fs from "node:fs/promises";

import { generate } from "astring";
import { builders } from "estree-toolkit";
import { parseModule } from "meriyah";

import { findConfigFile } from "../utils/findConfigFile";
import { updatePackageJSON } from "../utils/updatePackageJSON";

// Officially supported plugins, defined in `/plugins/**` packages.
const AVAILABLE_PLUGINS = ["unocss", "tailwindcss"];

/**
 * @description Installs a Stein plugin and adds it to the `stein.config.{ts,js,mjs,mts,cts}` file.
 * @param pluginName The name of the plugin to install (will be translated to `stein-plugin-<pluginName>`)
 * @param projectDir The directory of the project
 */
export const installSteinPlugin = async (
  pluginName: string,
  projectDir: string,
) => {
  if (!AVAILABLE_PLUGINS.includes(pluginName)) {
    throw new Error("not a valid stein plugin");
  }

  const configFile = await findConfigFile(projectDir);
  if (!configFile)
    throw new Error(
      "couldn't find a stein.config file in the project directory",
    );

  const originalCode = await fs.readFile(configFile, "utf-8");
  const node = parseModule(originalCode);

  const importNodes = node.body.filter((n) => n.type === "ImportDeclaration");
  const pluginImportNodes = importNodes.filter(
    (n) => n.source.value === `stein-plugin-${pluginName}`,
  );
  const lastImportIndex = importNodes.findIndex(
    (n) => n === pluginImportNodes[pluginImportNodes.length - 1],
  );

  if (pluginImportNodes.length === 0) {
    // Insert the import statement at the top of the file
    const declaration = builders.importDeclaration(
      [builders.importDefaultSpecifier(builders.identifier(pluginName))],
      builders.literal(`stein-plugin-${pluginName}`),
    );

    // insert after lastImportIndex
    // @ts-expect-error : no typed correctly within packages
    node.body.splice(lastImportIndex + 1, 0, declaration);
  }

  const exportDefaultNode = node.body.find(
    (n) => n.type === "ExportDefaultDeclaration",
  );
  if (!exportDefaultNode) throw new Error("export default not found");

  // Ensure `defineConfig()` is used.
  if (
    exportDefaultNode.declaration.type !== "CallExpression" ||
    exportDefaultNode.declaration.callee.type !== "Identifier" ||
    exportDefaultNode.declaration.callee.name !== "defineConfig"
  )
    throw new Error("defineConfig() not found");

  const configNode = exportDefaultNode.declaration.arguments[0];
  if (configNode.type !== "ObjectExpression")
    throw new Error("no argument given to defineConfig()");

  const pluginsProp = configNode.properties.find((prop) => {
    if (prop.type !== "Property") return false;
    if (prop.key.type === "Identifier") {
      if (prop.key.name === "plugins") return true;
    }

    return false;
  });

  const pluginExpressionCall = builders.callExpression(
    builders.identifier(pluginName),
    getPluginArguments(pluginName),
  );

  if (!pluginsProp) {
    // no plugins property, let's add one
    configNode.properties.push(
      // @ts-expect-error : no typed correctly within packages
      builders.property(
        "init",
        builders.identifier("plugins"),
        builders.arrayExpression([pluginExpressionCall]),
      ),
    );
  } else {
    // check it's an array
    if (pluginsProp.type !== "Property")
      throw new Error("plugins property is not a property");
    if (pluginsProp.value.type !== "ArrayExpression")
      throw new Error("plugins property is not an array");

    // check if the plugin is already added
    if (
      pluginsProp.value.elements.find((el) => {
        if (!el || el.type !== "CallExpression") return false;
        if (el.callee.type !== "Identifier") return false;
        return el.callee.name === pluginName;
      })
    )
      throw new Error(
        `Plugin ${pluginName} is already added to the configuration.`,
      );
    else {
      // add the plugin to the array
      // @ts-expect-error : no typed correctly within packages
      pluginsProp.value.elements.push(pluginExpressionCall);
    }
  }

  let output = generate(node);

  const comment = "// See the documentation for more details.";
  const defaultExport = "export default defineConfig";
  output = output.replace(`\n${comment}`, "");
  output = output.replace(`${defaultExport}`, `\n${comment}\n${defaultExport}`);
  await fs.writeFile(configFile, output, "utf-8");

  await updatePackageJSON(projectDir, async (pkg) => {
    pkg.devDependencies[`stein-plugin-${pluginName}`] = "latest";

    const dependencies = getPluginDependencies(pluginName);
    for (const dep of dependencies) {
      const key = dep.dev ? "devDependencies" : "dependencies";
      pkg[key][dep.name] = "latest";
    }
  });
};

const getPluginArguments = (pluginName: string) => {
  if (pluginName === "unocss") {
    return [
      builders.objectExpression([
        // Add "injectReset: true" as default.
        builders.property(
          "init",
          builders.identifier("injectReset"),
          builders.identifier("true"),
        ),
      ]),
    ];
  }

  return [];
};

export const getPluginDependencies = (
  pluginName: string,
): Array<{ name: string; dev: boolean }> => {
  if (pluginName === "unocss") {
    return [{ name: "@unocss/reset", dev: false }];
  }

  return [];
};
