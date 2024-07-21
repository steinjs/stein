#!/usr/bin/env node
import { Command } from 'commander';
import { devModule } from './modules/dev';
import { createModule } from './modules/create';

const program = new Command();

program
  .name('stein')
  .description('CLI to run projects and scaffold a new stein project')
  .version('0.1.0');

program.command('dev')
  .description('start the stein development server')
  .action(devModule);

program.command('create')
  .description('scaffold a new stein project')
  .action(createModule);

program.parse();
