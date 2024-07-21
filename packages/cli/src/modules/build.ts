import { build, type SteinConfig } from "@steinjs/core";
import type { Command } from "commander";
import { loadConfig } from "c12";

export const buildModule = async (options: unknown, command: Command) => {
  console.clear();

  const cwd = process.cwd();

  const { config } = await loadConfig<SteinConfig>({
    cwd,
    name: "stein",
  });

  await build(cwd, config);
}