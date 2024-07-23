#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import { version } from "../package.json";
import { buildModule } from "./modules/build";
import { createModule } from "./modules/create";
import { devModule } from "./modules/dev";

export { createModule }; // export for usage in create-stein

const pathToThisFile = resolve(fileURLToPath(import.meta.url));
const pathPassedToNode = resolve(process.argv[1]);
const isThisFileBeingRunViaCLI = pathToThisFile.includes(pathPassedToNode);

if (isThisFileBeingRunViaCLI) {
  const program = new Command();

  program
    .name("stein")
    .description("CLI to run projects and scaffold a new stein project")
    .version(version);

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
}
