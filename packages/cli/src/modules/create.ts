import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";

import * as clp from "@clack/prompts";
import color from "picocolors";

import { installSteinPlugin } from "../installers/plugins";
import { installDependencies } from "../utils/installDependencies";
import { updatePackageJSON } from "../utils/updatePackageJSON";
import { installSteinTool } from "../installers/tools";

export const createModule = async (
  str?: unknown,
  options?: unknown,
): Promise<void> => {
  const bareTemplateLink = "github:steinjs/stein/examples/bare";
  await setupWizard(bareTemplateLink);
};

const setupWizard = async (templateLink: string): Promise<void> => {
  intro(color.bgMagenta(" stein create "));

  const name = await text({
    message: "What is the name of your project?",
    placeholder: "my-stein-project",
    defaultValue: "my-stein-project",
  });

  if (isCancel(name)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  const projectType = await select({
    message: "Pick a project preset.",
    options: [
      { value: "minimal", label: "Minimal Starter" },
      { value: "custom", label: "Custom" },
      // TODO: Add custom presets here later.
    ],
  });

  if (isCancel(projectType)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  let plugins: string[] | undefined;
  let tools: string[] | undefined;

  if (projectType === "custom") {
    // TODO: Generate these programmatically based on the plugins and tools available.
    const group = await clp.group(
      {
        tools: () =>
          clp.multiselect({
            message: "What tools do you want to install?",
            options: [
              { value: "biome", label: "Biome" },
              { value: "eslint", label: "ESLint" },
              { value: "prettier", label: "Prettier" },
            ],
            required: false,
          }),
        plugins: () =>
          clp.multiselect({
            message: "What plugins do you want to add to your project?",
            options: [
              { value: "unocss", label: "UnoCSS" },
              { value: "tailwindcss", label: "TailwindCSS" },
            ],
            required: false,
          }),
      },
      {
        onCancel: () => {
          clp.cancel("Operation cancelled.");
          process.exit(0);
        },
      },
    );

    if (group.tools && group.tools.length > 0 && Array.isArray(group.tools)) {
      tools = group.tools as string[];
    }

    if (
      group.plugins &&
      group.plugins.length > 0 &&
      Array.isArray(group.plugins)
    ) {
      plugins = group.plugins as string[];
    }
  }

  const typeScriptEnabled = await confirm({
    message: "Do you want to use TypeScript?",
  });

  if (isCancel(typeScriptEnabled)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  const projectDirectory = await cloneTemplate(name, templateLink);
  await updatePackageJSON(projectDirectory, async (pkg) => {
    pkg.name = name;

    for (const key of ["devDependencies", "dependencies"]) {
      if (!pkg[key]) continue;

      // Replace all "workspace:*" to "latest".
      for (const [packageName, version] of Object.entries(pkg[key])) {
        if (version === "workspace:*") {
          pkg[key][packageName] = "latest";
        }
      }
    }
  });

  if (!typeScriptEnabled) {
    // Remove TS related config files.
    await fs.rm(path.join(projectDirectory, "tsconfig.json"));
    await fs.rm(path.join(projectDirectory, "tsconfig.app.json"));
    await fs.rm(path.join(projectDirectory, "tsconfig.node.json"));

    // Rename the stein.config file from ".ts" to ".js".
    const oldConfigPath = path.join(projectDirectory, "stein.config.ts");
    const newConfigPath = path.join(projectDirectory, "stein.config.js");
    await fs.rename(oldConfigPath, newConfigPath);

    // Rename the index file from ".tsx" to ".jsx".
    const oldIndexPath = path.join(projectDirectory, "src", "index.tsx");
    const newIndexPath = path.join(projectDirectory, "src", "index.jsx");
    await fs.rename(oldIndexPath, newIndexPath);

    // Remove the type.
    const oldIndexContent = await fs.readFile(newIndexPath, "utf-8");
    const newIndexContent = oldIndexContent.replace(" as HTMLDivElement", "");
    await fs.writeFile(newIndexPath, newIndexContent);
  }

  if (plugins) {
    await installProjectPlugins(projectDirectory, plugins);
  }

  if (tools) {
    await installProjectTools(projectDirectory, tools, typeScriptEnabled);
  }

  const shouldInstallDependencies = await confirm({
    message: "Do you want to install dependencies?",
  });

  if (isCancel(shouldInstallDependencies)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  if (shouldInstallDependencies) {
    await installProjectDependencies(projectDirectory);
  }

  const shouldInitGitRepo = await confirm({
    message: "Do you want to init a new Git repository?",
  });

  if (isCancel(shouldInitGitRepo)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  if (shouldInitGitRepo) {
    await initGitRepository(projectDirectory);
  }

  outro(`Stein project ${color.inverse(` ${name} `)} created successfully!`);
};

const cloneTemplate = async (
  projectName: string,
  templateLink: string,
): Promise<string> => {
  const s = spinner();
  s.start("Downloading template...");

  // Fixes an issue with "tar" (used in "giget") on Windows when using Bun.
  const needTarWorkaround =
    // @ts-expect-error : see https://github.com/oven-sh/bun/issues/12696
    typeof Bun !== "undefined" && process.platform === "win32";
  if (needTarWorkaround) process.env.__FAKE_PLATFORM__ = "linux";

  const { downloadTemplate } = await import("giget");

  // biome-ignore lint/performance/noDelete: required for what we are doing here
  if (needTarWorkaround) delete process.env.__FAKE_PLATFORM__;

  const { dir } = await downloadTemplate(templateLink, {
    force: true,
    dir: projectName,
  });

  s.stop("Successfully downloaded template.");
  return dir;
};

const installProjectDependencies = async (
  projectDirectory: string,
): Promise<void> => {
  const s = spinner();
  s.start("Installing dependencies...");

  try {
    await installDependencies(projectDirectory);
    s.stop("Installed dependencies successfully.");
  } catch (error) {
    console.error(error);
    s.stop("Failed installing dependencies, skipping...");
  }
};

const initGitRepository = async (projectDirectory: string): Promise<void> => {
  const s = spinner();
  s.start("Initializing git repository...");

  try {
    spawnSync("git", ["init"], {
      cwd: projectDirectory,
      stdio: "ignore",
    });

    s.stop("Initialized git repository successfully.");
  } catch (error) {
    console.error(error);
    s.stop("Failed initializing git repository, skipping...");
  }
};

const installProjectPlugins = async (
  projectDirectory: string,
  pluginNames: string[],
): Promise<void> => {
  const s = spinner();
  s.start("Installing integrations...");

  for (const pluginName of pluginNames) {
    try {
      await installSteinPlugin(pluginName, projectDirectory);
    } catch (err) {
      console.error(err);
    }
  }

  s.stop("Installed plugins successfully.");
};

const installProjectTools = async (
  projectDir: string,
  tools: string[],
  typeScriptEnabled: boolean,
): Promise<void> => {
  // If there is both eslint and prettier in the tools array, remove those elements and replace them with eslint-prettier
  if (tools.includes("eslint") && tools.includes("prettier")) {
    tools.splice(tools.indexOf("eslint"), 1);
    tools.splice(tools.indexOf("prettier"), 1);
    tools.push("eslint-prettier");
  }

  for (const tool of tools) {
    await installSteinTool(tool, projectDir, typeScriptEnabled);
  }
};
