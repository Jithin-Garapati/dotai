import chalk from 'chalk';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import { loadConfig, saveConfig, enableProvider, disableProvider } from '../lib/config.js';
import { providers, getProviderIds } from '../providers/index.js';
import { getConfigFilePath, getSkillsRepoDir } from '../lib/paths.js';

export async function configCommand(options) {
  const config = await loadConfig();

  if (options.show) {
    console.log(chalk.bold('\n⚙️  Current Configuration\n'));
    console.log(chalk.dim(`Config file: ${getConfigFilePath()}`));
    console.log(chalk.dim(`Skills repo: ${getSkillsRepoDir()}\n`));
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    return;
  }

  // Interactive config
  console.log(chalk.bold('\n⚙️  Configure skills-cli\n'));

  const allProviders = getProviderIds();

  const answers = await prompt([
    {
      type: 'multiselect',
      name: 'enabledProviders',
      message: 'Select providers to enable:',
      choices: allProviders.map(id => ({
        name: id,
        message: `${providers[id].name} - ${chalk.dim(providers[id].description)}`,
        value: id
      })),
      initial: config.enabledProviders
    },
    {
      type: 'select',
      name: 'defaultScope',
      message: 'Default installation scope:',
      choices: [
        { name: 'global', message: 'Global - Available in all projects' },
        { name: 'project', message: 'Project - Only in current project' }
      ],
      initial: config.defaultScope === 'project' ? 1 : 0
    }
  ]);

  const newConfig = {
    ...config,
    enabledProviders: answers.enabledProviders,
    defaultScope: answers.defaultScope,
    updatedAt: new Date().toISOString()
  };

  await saveConfig(newConfig);

  console.log(chalk.green('\n✓ Configuration saved\n'));
}

export async function enableCommand(providerId) {
  if (!providerId) {
    console.error(chalk.red('Error: Provider ID required'));
    console.log(`Available providers: ${getProviderIds().join(', ')}`);
    return;
  }

  if (!providers[providerId]) {
    console.error(chalk.red(`Unknown provider: ${providerId}`));
    console.log(`Available providers: ${getProviderIds().join(', ')}`);
    return;
  }

  await enableProvider(providerId);
  console.log(chalk.green(`✓ Enabled ${providers[providerId].name}`));
}

export async function disableCommand(providerId) {
  if (!providerId) {
    console.error(chalk.red('Error: Provider ID required'));
    console.log(`Available providers: ${getProviderIds().join(', ')}`);
    return;
  }

  if (!providers[providerId]) {
    console.error(chalk.red(`Unknown provider: ${providerId}`));
    console.log(`Available providers: ${getProviderIds().join(', ')}`);
    return;
  }

  await disableProvider(providerId);
  console.log(chalk.green(`✓ Disabled ${providers[providerId].name}`));
}
