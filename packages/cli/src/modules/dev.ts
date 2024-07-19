import { startDevelopmentServer } from "@steinjs/core";
import type { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";

const getConfigPath = async (): Promise<string | null> => {
  const extensions = ["ts", "js"];
  let configPath: string | null = null;

  for (const extension of extensions) {
    const currentConfigPath = path.join(process.cwd(), `stein.config.${extension}`);
    const exists = await fs.access(currentConfigPath).then(() => true).catch(() => false);
    if (!exists) continue;
    
    configPath = currentConfigPath;
  }

  return configPath;
}

export const devModule = async (options: unknown, command: Command) => {
  const configPath = await getConfigPath();
  
  if (configPath === null)
    throw new Error("stein.config.{ts,js} not found in the project directory.");

  // NOTE: Importing directly the `ts` file only works in Bun or ts-node.
  // We'll need a check for Node.js here where it should bundle to a .mjs file or anything
  // that Node.js can understand using esbuild or any other bundler.
  const { default: config } = await import(configPath);
  await startDevelopmentServer(process.cwd(), config);
}
