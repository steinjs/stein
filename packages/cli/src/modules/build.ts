import { type SteinConfig, build } from "@steinjs/core";
import { loadConfig } from "c12";
import type { Command } from "commander";

export const buildModule = async (options: unknown, command: Command) => {
  console.clear();

  const cwd = process.cwd();

  const { config } = await loadConfig<SteinConfig>({
    cwd,
    name: "stein",
  });

  await build(cwd, config);
};
