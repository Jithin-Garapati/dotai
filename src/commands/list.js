import chalk from 'chalk';
import fs from 'fs-extra';
import { listCentralSkills, getSkillInstallStatus } from '../lib/skills.js';
import { getSkillsRepoDir } from '../lib/paths.js';
import { providers } from '../providers/index.js';

export async function listCommand(options) {
  console.log(chalk.bold('\n📋 Skills Repository\n'));

  const skills = await listCentralSkills();

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills found in your repository.'));
    console.log(chalk.dim(`Location: ${getSkillsRepoDir()}`));
    console.log(`\nCreate one with: ${chalk.cyan('dotai skill create')}\n`);
    return;
  }

  // Show skills with installation status
  for (const skill of skills) {
    console.log(chalk.bold.white(skill.name));
    console.log(chalk.dim(`  ${skill.description || 'No description'}`));

    if (options.verbose) {
      console.log(chalk.dim(`  Path: ${skill.path}`));

      // Show installation status
      const status = await getSkillInstallStatus(skill.name);
      const installed = [];

      for (const [providerId, providerStatus] of Object.entries(status)) {
        if (providerStatus.global || providerStatus.project) {
          const scopes = [];
          if (providerStatus.global) scopes.push('global');
          if (providerStatus.project) scopes.push('project');
          installed.push(`${providerStatus.name} (${scopes.join(', ')})`);
        }
      }

      if (installed.length > 0) {
        console.log(chalk.green(`  Installed: ${installed.join(', ')}`));
      } else {
        console.log(chalk.yellow('  Not installed anywhere'));
      }
    }

    console.log('');
  }

  console.log(chalk.dim(`Total: ${skills.length} skill(s)`));
  console.log(chalk.dim(`Location: ${getSkillsRepoDir()}\n`));

  if (!options.verbose) {
    console.log(chalk.dim(`Use ${chalk.cyan('dotai skill list -v')} to see installation status\n`));
  }
}

export async function listProvidersCommand() {
  console.log(chalk.bold('\n🔌 Supported Providers\n'));

  for (const provider of Object.values(providers)) {
    console.log(chalk.bold.white(provider.name) + chalk.dim(` (${provider.id})`));
    console.log(chalk.dim(`  ${provider.description}`));
    console.log(chalk.dim(`  Global: ${provider.globalPath()}`));
    console.log(chalk.dim(`  Project: ${provider.projectPath}/`));
    console.log('');
  }
}
