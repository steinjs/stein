import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  spinner,
} from "@clack/prompts";
import color from "picocolors";

import { AVAILABLE_PLUGINS, installSteinPlugin } from "../installers/plugins";
import { AVAILABLE_TOOLS, installSteinTool } from "../installers/tools";
import { findConfigFile } from "../utils/findConfigFile";
import { installDependencies } from "../utils/installDependencies";

export const addModule = async (integrations: string[]) => {
  let successfulIntegrationsAdded = 0;

  intro(color.bgGreen(" stein add "));

  const configFile = await findConfigFile(process.cwd());
  if (!configFile) {
    log.error(
      "No stein config file found, make sure you are inside a stein project.",
    );
    return;
  }

  for (const integration of integrations) {
    if (AVAILABLE_PLUGINS.includes(integration)) {
      await actionWithSpinner(
        async () => await installSteinPlugin(integration, process.cwd()),
        `Installing ${integration} plugin...`,
        `Installed ${integration} plugin successfully!`,
      );
      successfulIntegrationsAdded++;
    } else if (AVAILABLE_TOOLS.includes(integration)) {
      await actionWithSpinner(
        async () => await installSteinTool(integration, process.cwd()),
        `Installing ${integration} tool...`,
        `Installed ${integration} tool successfully!`,
      );
      successfulIntegrationsAdded++;
    } else {
      log.error(`Unknown integration ${integration}, skipping installation...`);
    }
  }

  // Ask if user wants to install dependencies using clack prompt
  const shouldInstallDependencies = await confirm({
    message: "Do you want to install dependencies?",
  });

  if (isCancel(shouldInstallDependencies)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  if (shouldInstallDependencies) {
    await actionWithSpinner(
      async () => await installDependencies(process.cwd()),
      "Installing dependencies...",
      "Dependencies installed successfully.",
    );
  }

  outro(
    `Added ${color.cyan(`${successfulIntegrationsAdded} integrations`)} successfully!`,
  );
};

const actionWithSpinner = async (
  action: () => Promise<void>,
  startMessage: string,
  endMessage: string,
) => {
  const s = spinner();
  s.start(startMessage);
  try {
    await action();
  } finally {
    s.stop(endMessage);
  }
};
