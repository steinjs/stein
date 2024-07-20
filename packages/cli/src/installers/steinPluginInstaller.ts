import fs from "node:fs/promises"

import { loadConfig } from "c12";
import { addDependency } from "nypm";

import * as babel from "@babel/core";
import { traverse } from "@babel/core";
import * as t from '@babel/types';
import generate from "@babel/generator";

const availableSteinPlugins = ['unocss', 'tailwindcss'];
const availableToolIntegrations = ['biome', 'eslint', 'prettier'];

export const installSteinPlugin = async (pkgName: string, projectDir: string) => {
    if (!availableSteinPlugins.includes(pkgName)) {
        installToolIntegration(pkgName);
    }

    // Installation logic here, use magicast to add import for plugin at the top and put function into array
    const {configFile} = await loadConfig({
        cwd: projectDir,
        name: "stein"
    });

    if (!configFile) {
        throw new Error(`Could not find a stein config file in ${projectDir}`);
    }

    const configCode = await fs.readFile(configFile, "utf-8");
    const ast = babel.parse(configCode, {
        sourceType: 'module',
        plugins: ['@babel/plugin-syntax-typescript'],
    });

    if (!ast) {
        throw new Error(`Could not parse the stein config file at ${configFile}`);
    }

    traverse(ast, {
        Program(path) {
            // Add the import statement for the plugin
            const importLines = path.node.body.filter(
                (node): node is t.ImportDeclaration =>
                    t.isImportDeclaration(node) 
            );

            const importDeclaration = t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier(pkgName))],
                t.stringLiteral(`stein-plugin-${pkgName}`)
            );

            path.node.body.splice(importLines.length, 0, importDeclaration);
        },
        ObjectExpression(path) {
            // Find the plugins array
            const pluginsProperty = path.node.properties.find(
                (prop): prop is t.ObjectProperty => 
                    t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
            );    

            if (pluginsProperty && t.isArrayExpression(pluginsProperty.value)) {
                // Create the new plugin node
                const newPlugin = t.callExpression(
                    t.identifier(pkgName),
                    getPluginArguments(pkgName)
                );
        
                pluginsProperty.value.elements.push(newPlugin);
            }
        },
    });
    
    const { code: updatedCode } = generate(ast);

    // Insert an empty line between the last import and the configuration for cosmetic reasons
    const lines = updatedCode.split('\n');
    const lastImportIndex = lines.findIndex(line => line.startsWith('import ') && !lines[lines.indexOf(line) + 1].startsWith('import '));
    if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, ''); // Add an empty line after the last import
    }
    const finalCode = lines.join('\n');
    
    await fs.writeFile(configFile, finalCode, 'utf-8');

    // After adding the plugin to the config, add the package to the dependencies
    /*
    await addDependency(`stein-plugin-${pkgName}`,{
        cwd: projectDir,
        dev: true
    });
    */
    // Also install the actual package for the integration
    if (pkgName === "unocss") {
        // Add the UnoCSS reset as a dependency
        await addDependency("@unocss/reset", {
            cwd: projectDir,
            dev: true
        });
    }

    console.log(`Added plugin ${pkgName} to the stein config file at ${configFile} successfully.`);
}

const getPluginArguments = (pkgName: string) => {
    if (pkgName === 'unocss') {
        // Add reset as a default for UnoCSS
        return [t.objectExpression([t.objectProperty(t.identifier('injectReset'), t.booleanLiteral(true))])];
    }
    else {
        return [];
    }
}

const installToolIntegration = async (pkgName: string) => {
    if (!availableToolIntegrations.includes(pkgName)) {
        throw new Error(`Tool integration ${pkgName} is not a valid Stein plugin or tool integration.`);
    }

    // Install the tool integration
}
