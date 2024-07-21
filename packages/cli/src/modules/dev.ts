import { type SteinConfig, dev } from "@steinjs/core";
import { watchConfig } from "c12";
import type { Command } from "commander";

export const devModule = async (options: unknown, command: Command) => {
  console.clear();

  const cwd = process.cwd();
  let server: Awaited<ReturnType<typeof dev>> | undefined;

  const { config } = await watchConfig<SteinConfig>({
    cwd,
    name: "stein",
    onUpdate: async ({ newConfig: { config } }) => {
      if (server) {
        await server.close();
        // For some reason we have to do this.
        server.httpServer?.close();

        console.clear();
        server = await dev(cwd, config);
        server.printUrls();
        server.bindCLIShortcuts({ print: true });
      }
    },
  });

  server = await dev(cwd, config);
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
};
