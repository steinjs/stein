import type { ViteDevServer } from "vite";
import type { SteinDevServer } from ".";
import path from "node:path";
import fs from "node:fs";
import { loadConfig } from "c12";
import defu from "defu";

export function until(conditionFunction: () => boolean) {
  return new Promise<void>((resolve) => {
    void (function check() {
      if (conditionFunction()) resolve();
      else setTimeout(check, 100);
    })();
  });
}

export function waitToAddToWatcher(
  filePaths: string[],
  server: ViteDevServer,
): void {
  queueMicrotask(() => {
    until(() => "stein" in server).then(() => {
      for (const filePath of filePaths) {
        (server as SteinDevServer).stein?.watcher.add(filePath);
      }
    });
  });
}

export const checkFileExists = (path: string) => {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const DEFAULT_JS_EXTENSIONS = [".js", ".ts", ".mjs", ".mts", ".cts"];

/**
 * @param defaultConfigName base name for the configuration, eg.: `tailwind.config` (without) extension
 */
export const findDefaultConfigFilePath = (
  cwd: string,
  defaultConfigName: string,
  extensions = DEFAULT_JS_EXTENSIONS,
): string | undefined => {
  for (const ext of extensions) {
    const configFile = path.join(cwd, `${defaultConfigName}${ext}`);
    if (checkFileExists(configFile)) return configFile;
  }
};

/**
 * Reads the configuration script
 * and merges with default configuration.
 */
export const readConfigurationScript = async <T extends object>(
  cwd: string,
  configName: string,
  defaultConfig?: Partial<T>,
): Promise<T> => {
  const { config } = await loadConfig<T>({
    cwd,
    configFile: configName,
  });

  return defu(config ?? {}, defaultConfig) as T;
};

/**
 * Provides information to use
 * `readConfigurationScript`.
 *
 * @param configPath relative path of the configuration script, eg.: `configs/tailwind.config.ts`
 * @param defaultConfigName base name for the configuration, eg.: `tailwind.config` (without) extension
 */
export const findConfigurationScript = (
  configPath: string,
  defaultConfigName: string,
) => {
  // No file is present, provide default so C12 can look up for us.
  if (!checkFileExists(configPath)) {
    return {
      configName: defaultConfigName,
      cwd: process.cwd(),
    };
  }

  const specifiedConfig = path.join(process.cwd(), configPath);
  const specifiedConfigPath = path.dirname(specifiedConfig);
  const specifiedConfigFileName = path.basename(specifiedConfig);

  // Remove file extension from config file name (.ts, .js, .cjs, etc.)
  // C12 will look that up automatically for us.
  const specifiedConfigFileNameWithoutExtension = path.basename(
    specifiedConfigFileName,
    path.extname(specifiedConfigFileName),
  );

  return {
    cwd: specifiedConfigPath,
    configName: specifiedConfigFileNameWithoutExtension,
  };
};

/**
 * Provides the full path for a configuration script
 * so the vite watcher can hook up to it.
 *
 * @param configPath relative path of the configuration script, eg.: `configs/tailwind.config.ts`
 * @param defaultConfigName base name for the configuration, eg.: `tailwind.config` (without) extension
 */
export const findConfigurationScriptFullPath = (
  configPath: string,
  defaultConfigName: string,
): string | undefined => {
  if (checkFileExists(configPath)) {
    return path.join(process.cwd(), configPath);
  }

  return findDefaultConfigFilePath(process.cwd(), defaultConfigName);
};
