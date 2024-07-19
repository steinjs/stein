import { createServer } from "vite";
import solid from "vite-plugin-solid";
import type { PartialDeep } from "type-fest";

export const startDevelopmentServer = async (cwd: string, config: SteinConfig): Promise<void> => {
  const server = await createServer({
    plugins: [solid()],
    root: cwd,

    clearScreen: false,
  });
  
  await server.listen(config.development.port);
  console.info(`Stein running SolidJS at http://localhost:${config.development.port}`);
};

export interface SteinConfig {
  development: {
    port: number;
  }
}

export const defineConfig = (options: PartialDeep<SteinConfig>): SteinConfig => ({
  ...options,

  development: {
    port: 3000,
    ...options.development
  }
});
