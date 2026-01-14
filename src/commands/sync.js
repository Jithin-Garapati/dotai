import chalk from 'chalk';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import ora from 'ora';
import { listCentralSkills, installSkill, getSkillInstallStatus } from '../lib/skills.js';
import { loadConfig } from '../lib/config.js';
import { providers, getProviderIds } from '../providers/index.js';

export async function syncCommand(options) {
  console.log(chalk.bold('\n🔄 Sync skills to providers\n'));

  const config = await loadConfig();
  const skills = await listCentralSkills();

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills to sync.'));
    console.log(`Create skills with: ${chalk.cyan('dotai skill create')}\n`);
    return;
  }

  // Determine target providers
  let targetProviders = options.providers
    ? options.providers.split(',').map(p => p.trim())
    : config.enabledProviders;

  if (options.all) {
    targetProviders = getProviderIds();
  }

  // Determine scope
  const scope = options.project ? 'project' : 'global';

  console.log(chalk.dim(`Syncing ${skills.length} skill(s) to ${targetProviders.length} provider(s)...\n`));

  const results = {
    installed: 0,
    skipped: 0,
    failed: 0
  };

  for (const skill of skills) {
    const spinner = ora(`Syncing ${skill.name}...`).start();

    try {
      const installResults = await installSkill(skill.name, targetProviders, scope);

      const successes = installResults.filter(r => r.success).length;
      const failures = installResults.filter(r => !r.success).length;

      results.installed += successes;
      results.failed += failures;

      if (failures === 0) {
        spinner.succeed(`${skill.name} → ${successes} provider(s)`);
      } else {
        spinner.warn(`${skill.name} → ${successes} ok, ${failures} failed`);
      }
    } catch (err) {
      spinner.fail(`${skill.name}: ${err.message}`);
      results.failed++;
    }
  }

  console.log('');
  console.log(chalk.bold('Summary:'));
  console.log(chalk.green(`  ✓ Installed: ${results.installed}`));
  if (results.failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${results.failed}`));
  }
  console.log('');
}
