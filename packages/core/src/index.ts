import { createServer, createViteRuntime } from "vite";

export const startDevelopmentServer = async (cwd: string) => {
  const server = await createServer({
    plugins: [],
    root: cwd
  });
  
  await server.listen(3000);
};
