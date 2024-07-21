#!/usr/bin/env node
import { Command } from 'commander';
import { createModule } from './modules/create';
import { devModule } from './modules/dev';
import { buildModule } from './modules/build';
import { version } from "../package.json";

const program = new Command();

program
  .name('stein')
  .description('CLI to run projects and scaffold a new stein project')
  .version(version);

program.command('dev')
  .description('start the stein development server')
  .action(devModule);

program.command('build')
  .description('make a stein production build')
  .action(buildModule);

program.command('create')
  .description('scaffold a new stein project')
  .action(createModule);

program.parse();
