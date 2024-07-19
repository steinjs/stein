import { startDevelopmentServer, type SteinConfig } from "@steinjs/core";
import type { Command } from "commander";
import { loadConfig } from "c12";

export const devModule = async (options: unknown, command: Command) => {
  const cwd = process.cwd();
  
  const { config } = await loadConfig<SteinConfig>({ cwd, name: "stein" });
  await startDevelopmentServer(cwd, config);
}
