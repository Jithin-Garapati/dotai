#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initConfig } from './lib/config.js';
import { createCommand } from './commands/create.js';
import { installCommand } from './commands/install.js';
import { listCommand, listProvidersCommand } from './commands/list.js';
import { syncCommand } from './commands/sync.js';
import { uninstallCommand } from './commands/uninstall.js';
import { configCommand, enableCommand, disableCommand } from './commands/config.js';
import { openCommand, openRepoCommand } from './commands/open.js';

const program = new Command();

// Initialize config on startup
await initConfig();

program
  .name('dotai')
  .description('Dotfiles for AI - manage skills & MCP servers across all your AI coding assistants')
  .version('1.0.0');

// Skill subcommand
const skill = program.command('skill').description('Manage AI agent skills');

skill
  .command('create [name]')
  .description('Create a new skill (opens editor for instructions)')
  .option('-d, --description <desc>', 'Short description of the skill')
  .action(createCommand);

skill
  .command('install [skill]')
  .description('Install a skill to providers')
  .option('-p, --providers <list>', 'Comma-separated list of providers')
  .option('-a, --all', 'Install to all providers')
  .option('--project', 'Install to project scope (default: global)')
  .option('-i, --interactive', 'Interactively select providers')
  .action(installCommand);

skill
  .command('uninstall [skill]')
  .description('Uninstall a skill from providers')
  .option('-p, --providers <list>', 'Comma-separated list of providers')
  .option('-a, --all', 'Uninstall from all providers')
  .option('--project', 'Uninstall from project scope (default: global)')
  .option('-y, --yes', 'Skip confirmation')
  .action(uninstallCommand);

skill
  .command('list')
  .alias('ls')
  .description('List all skills in your repository')
  .option('-v, --verbose', 'Show installation status')
  .action(listCommand);

skill
  .command('sync')
  .description('Sync all skills to enabled providers')
  .option('-p, --providers <list>', 'Comma-separated list of providers')
  .option('-a, --all', 'Sync to all providers')
  .option('--project', 'Sync to project scope (default: global)')
  .action(syncCommand);

skill
  .command('open [skill]')
  .description('Open a skill folder or file')
  .option('-f, --file', 'Open SKILL.md file directly')
  .action(openCommand);

// MCP subcommand (placeholder for now)
const mcp = program.command('mcp').description('Manage MCP servers (coming soon)');

mcp
  .command('add')
  .description('Add an MCP server (coming soon)')
  .action(() => {
    console.log(chalk.yellow('\nMCP management coming soon!\n'));
    console.log(chalk.dim('This will let you configure MCP servers once and sync to:'));
    console.log(chalk.dim('  • Claude Code    • Claude Desktop   • Cursor'));
    console.log(chalk.dim('  • VS Code        • Cline            • Windsurf\n'));
  });

mcp
  .command('list')
  .description('List MCP servers (coming soon)')
  .action(() => {
    console.log(chalk.yellow('\nMCP management coming soon!\n'));
  });

// Config commands
program
  .command('providers')
  .description('List all supported providers')
  .action(listProvidersCommand);

program
  .command('config')
  .description('Configure dotai settings')
  .option('-s, --show', 'Show current configuration')
  .action(configCommand);

program
  .command('enable <provider>')
  .description('Enable a provider')
  .action(enableCommand);

program
  .command('disable <provider>')
  .description('Disable a provider')
  .action(disableCommand);

program
  .command('repo')
  .description('Open the dotai repository folder')
  .action(openRepoCommand);

// Show help if no command
program.parse();

if (!process.argv.slice(2).length) {
  console.log(chalk.bold(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                        dotai v1.0.0                       ║
  ║         Dotfiles for AI - Skills & MCP in one place       ║
  ╚═══════════════════════════════════════════════════════════╝
  `));

  console.log(chalk.bold('  Skills - manage across Claude, Gemini, Cursor, Codex & more:'));
  console.log(`    ${chalk.cyan('dotai skill create')}         Create a new skill`);
  console.log(`    ${chalk.cyan('dotai skill install <name>')} Install to all providers`);
  console.log(`    ${chalk.cyan('dotai skill list')}           List your skills`);
  console.log(`    ${chalk.cyan('dotai skill sync')}           Sync all skills\n`);

  console.log(chalk.bold('  MCP Servers - coming soon:'));
  console.log(`    ${chalk.dim('dotai mcp add')}              Add an MCP server`);
  console.log(`    ${chalk.dim('dotai mcp sync')}             Sync to all apps\n`);

  console.log(chalk.dim('  Run "dotai --help" for all commands\n'));
}
