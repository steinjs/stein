import fs from "node:fs/promises";
import path from "node:path";

export const SUPPORTED_EXTENSIONS = [".js", ".ts", ".mjs", ".mts", ".cts"];

export const findConfigFile = async (
  projectDir: string,
): Promise<string | undefined> => {
  for (const ext of SUPPORTED_EXTENSIONS) {
    const configFile = path.join(projectDir, `stein.config${ext}`);
    try {
      await fs.access(configFile, fs.constants.F_OK);
      return configFile;
    } catch {
      continue;
    }
  }
  return undefined;
};
