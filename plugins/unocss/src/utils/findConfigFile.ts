import fs from "node:fs";
import path from "node:path";

export const SUPPORTED_EXTENSIONS = [".js", ".ts", ".mjs", ".mts", ".cts"];

export const findConfigFile = (projectDir: string) => {
  for (const ext of SUPPORTED_EXTENSIONS) {
    const configFile = path.join(projectDir, `uno.config${ext}`);
    try {
      fs.accessSync(configFile, fs.constants.F_OK);
      return configFile;
    } catch {
      // Ignore error
    }
  }
  console.error("Tailwind config file not found");
  return undefined;
};
