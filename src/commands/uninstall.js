import chalk from 'chalk';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import ora from 'ora';
import { listCentralSkills, uninstallSkillFromProvider, getSkillInstallStatus } from '../lib/skills.js';
import { loadConfig } from '../lib/config.js';
import { providers, getProviderIds } from '../providers/index.js';

export async function uninstallCommand(skillName, options) {
  console.log(chalk.bold('\n🗑️  Uninstall skill from providers\n'));

  const config = await loadConfig();

  // If no skill name, show interactive picker
  if (!skillName) {
    const skills = await listCentralSkills();
    if (skills.length === 0) {
      console.log(chalk.yellow('No skills found.'));
      return;
    }

    const answer = await prompt({
      type: 'select',
      name: 'skill',
      message: 'Select a skill to uninstall:',
      choices: skills.map(s => ({
        name: s.name,
        message: `${s.name} - ${chalk.dim(s.description || 'No description')}`,
        value: s.name
      }))
    });
    skillName = answer.skill;
  }

  // Determine which providers to uninstall from
  let targetProviders = options.providers
    ? options.providers.split(',').map(p => p.trim())
    : config.enabledProviders;

  if (options.all) {
    targetProviders = getProviderIds();
  }

  // Determine scope
  const scope = options.project ? 'project' : 'global';

  // Confirm if not using --yes flag
  if (!options.yes) {
    const providerNames = targetProviders.map(id => providers[id]?.name || id).join(', ');
    const answer = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: `Uninstall '${skillName}' from ${providerNames}?`,
      initial: false
    });

    if (!answer.confirm) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
  }

  console.log(chalk.dim(`Uninstalling '${skillName}' from ${scope} scope...\n`));

  let removedCount = 0;

  for (const providerId of targetProviders) {
    const provider = providers[providerId];
    if (!provider) continue;

    try {
      const result = await uninstallSkillFromProvider(skillName, providerId, scope);

      if (result.removed) {
        console.log(chalk.green(`  ✓ ${provider.name}`));
        removedCount++;
      } else {
        console.log(chalk.dim(`  - ${provider.name} (not installed)`));
      }
    } catch (err) {
      console.log(chalk.red(`  ✗ ${provider.name}: ${err.message}`));
    }
  }

  console.log('');
  if (removedCount > 0) {
    console.log(chalk.green(`Removed from ${removedCount} provider(s)`));
  } else {
    console.log(chalk.yellow('Nothing to remove'));
  }
  console.log('');
}
