import chalk from 'chalk';
import { spawn } from 'child_process';
import { platform } from 'os';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import { listCentralSkills, getCentralSkill } from '../lib/skills.js';
import { getSkillsRepoDir } from '../lib/paths.js';

/**
 * Open a skill folder or file in the system default editor/file manager
 */
export async function openCommand(skillName, options) {
  let skill;

  // If no skill name, show interactive picker
  if (!skillName) {
    const skills = await listCentralSkills();
    if (skills.length === 0) {
      console.log(chalk.yellow('No skills found.'));
      console.log(`Create one with: ${chalk.cyan('dotai skill create')}\n`);
      return;
    }

    const answer = await prompt({
      type: 'select',
      name: 'skill',
      message: 'Select a skill to open:',
      choices: skills.map(s => ({
        name: s.name,
        message: `${s.name} - ${chalk.dim(s.description || 'No description')}`,
        value: s.name
      }))
    });
    skillName = answer.skill;
  }

  skill = await getCentralSkill(skillName);

  if (!skill) {
    console.error(chalk.red(`Skill '${skillName}' not found`));
    return;
  }

  const targetPath = options.file ? skill.filePath : skill.path;
  const openCmd = getOpenCommand();

  console.log(chalk.dim(`Opening: ${targetPath}\n`));

  spawn(openCmd, [targetPath], {
    detached: true,
    stdio: 'ignore'
  }).unref();
}

/**
 * Get the platform-specific command to open files/folders
 */
function getOpenCommand() {
  switch (platform()) {
    case 'darwin':
      return 'open';
    case 'win32':
      return 'explorer';
    default:
      return 'xdg-open';
  }
}

/**
 * Open the entire skills repository folder
 */
export async function openRepoCommand() {
  const repoPath = getSkillsRepoDir();
  const openCmd = getOpenCommand();

  console.log(chalk.dim(`Opening skills repository: ${repoPath}\n`));

  spawn(openCmd, [repoPath], {
    detached: true,
    stdio: 'ignore'
  }).unref();
}
