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
  .description('Split a string into substrings and display as an array')
  .action(async (str, options) => {
    await devModule(str, options);
});

program.command('create')
  .description('Split a string into substrings and display as an array')
  .action(async (str, options) => {
    await createModule(str, options)
});

program.parse();
