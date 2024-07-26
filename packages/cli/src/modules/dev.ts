import { type SteinConfig, dev, restartServer } from "@steinjs/core";
import { watchConfig } from "c12";
import type { Command } from "commander";

export const devModule = async (options: unknown, command: Command) => {
  console.clear();

  const cwd = process.cwd();
  // biome-ignore lint/style/useConst: <explanation>
  let server: Awaited<ReturnType<typeof dev>> | undefined;

  const { config } = await watchConfig<SteinConfig>({
    cwd,
    name: "stein",
    onUpdate: async ({ newConfig: { config } }) => {
      if (server) {
        await restartServer(server, config);
      }
    },
  });

  server = await dev(cwd, config);
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
};
