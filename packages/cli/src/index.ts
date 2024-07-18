#!/usr/bin/env node
import { Command } from 'commander';
import { startDevelopmentServer } from '@steinjs/core';

const program = new Command()
  .name("stein")
  .parse(process.argv);

switch (program.args[0]) {
  case "dev":
    await startDevelopmentServer(process.cwd());
    break;
  default:
    console.error("Command not found.");
    break;
}