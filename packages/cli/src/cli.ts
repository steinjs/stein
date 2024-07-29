#!/usr/bin/env node
import { Command } from "commander";
import color from "picocolors";

import { version } from "../package.json";
import { buildModule } from "./modules/build";
import { createModule } from "./modules/create";
import { devModule } from "./modules/dev";
import { addModule } from "./modules/add";
import { AVAILABLE_PLUGINS } from "./installers/plugins";
import { AVAILABLE_TOOLS } from "./installers/tools";

const program = new Command();

program
  .name("stein")
  .description("CLI to run projects and scaffold a new stein project")
  .version(version);

program
  .command("add")
  .description(
    "Add an integration (plugin or tool) to an existing stein project",
  )
  .argument("<integrations...>", "integrations to add")
  .action(addModule)
  .exitOverride(() => {
    console.log(
      `\n${color.bold(color.italic(color.cyan("Available integrations:")))} \n` +
        `${color.underline("Plugins:")} \n${AVAILABLE_PLUGINS.join(" ")}\n\n` +
        `${color.underline("Tools:")} \n${AVAILABLE_TOOLS.join(" ")}`,
    );
  });

program
  .command("dev")
  .description("start the stein development server")
  .action(devModule);

program
  .command("build")
  .description("make a stein production build")
  .action(buildModule);

program
  .command("create")
  .description("scaffold a new stein project")
  .action(createModule);

program.parse();
