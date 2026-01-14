import chalk from 'chalk';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import ora from 'ora';
import fs from 'fs-extra';
import { installSkill, listCentralSkills, importSkill } from '../lib/skills.js';
import { loadConfig } from '../lib/config.js';
import { providers, getProviderIds } from '../providers/index.js';

export async function installCommand(skillNameOrPath, options) {
  console.log(chalk.bold('\n📦 Install skill to providers\n'));

  const config = await loadConfig();
  let skillName = skillNameOrPath;

  // Check if it's a path to a skill folder
  if (skillNameOrPath && await fs.pathExists(skillNameOrPath)) {
    const spinner = ora('Importing skill from path...').start();
    try {
      const imported = await importSkill(skillNameOrPath);
      spinner.succeed(`Imported skill '${imported.name}'`);
      skillName = imported.name;
    } catch (err) {
      spinner.fail(chalk.red(`Failed to import: ${err.message}`));
      process.exit(1);
    }
  }

  // If no skill name, show interactive picker
  if (!skillName) {
    const skills = await listCentralSkills();
    if (skills.length === 0) {
      console.log(chalk.yellow('No skills found in your repository.'));
      console.log(`Create one with: ${chalk.cyan('dotai skill create')}\n`);
      process.exit(0);
    }

    const answer = await prompt({
      type: 'select',
      name: 'skill',
      message: 'Select a skill to install:',
      choices: skills.map(s => ({
        name: s.name,
        message: `${s.name} - ${chalk.dim(s.description || 'No description')}`,
        value: s.name
      }))
    });
    skillName = answer.skill;
  }

  // Determine which providers to install to
  let targetProviders = options.providers
    ? options.providers.split(',').map(p => p.trim())
    : config.enabledProviders;

  // If --all flag, use all providers
  if (options.all) {
    targetProviders = getProviderIds();
  }

  // Interactive provider selection if requested
  if (options.interactive) {
    const answer = await prompt({
      type: 'multiselect',
      name: 'providers',
      message: 'Select providers to install to:',
      choices: Object.values(providers).map(p => ({
        name: p.id,
        message: `${p.name} - ${chalk.dim(p.description)}`,
        value: p.id
      })),
      initial: targetProviders
    });
    targetProviders = answer.providers;
  }

  // Determine scope
  const scope = options.project ? 'project' : 'global';

  console.log(chalk.dim(`Installing '${skillName}' to ${scope} scope...\n`));

  const spinner = ora('Installing...').start();

  try {
    const results = await installSkill(skillName, targetProviders, scope);

    spinner.stop();

    // Show results
    let successCount = 0;
    let failCount = 0;

    for (const result of results) {
      const provider = providers[result.providerId];
      if (result.success) {
        successCount++;
        console.log(chalk.green(`  ✓ ${provider.name}`));
        console.log(chalk.dim(`    ${result.targetPath}`));
      } else {
        failCount++;
        console.log(chalk.red(`  ✗ ${provider.name}: ${result.error}`));
      }
    }

    console.log('');

    if (successCount > 0) {
      console.log(chalk.green(`Installed to ${successCount} provider(s)`));
    }
    if (failCount > 0) {
      console.log(chalk.red(`Failed for ${failCount} provider(s)`));
    }

    console.log('');

  } catch (err) {
    spinner.fail(chalk.red(`Failed to install: ${err.message}`));
    process.exit(1);
  }
}
