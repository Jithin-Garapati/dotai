import chalk from 'chalk';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import ora from 'ora';
import { spawn } from 'child_process';
import { platform } from 'os';
import { createSkill } from '../lib/skills.js';

/**
 * Get the command to open a file in default editor
 */
function getEditorCommand() {
  // Check for $EDITOR environment variable first
  if (process.env.EDITOR) {
    return process.env.EDITOR;
  }

  // Fall back to platform defaults
  switch (platform()) {
    case 'darwin':
      return 'open -t'; // Opens in default text editor on Mac
    case 'win32':
      return 'notepad';
    default:
      return process.env.VISUAL || 'xdg-open';
  }
}

/**
 * Open file in editor
 */
function openInEditor(filePath) {
  const editor = getEditorCommand();
  const parts = editor.split(' ');
  const cmd = parts[0];
  const args = [...parts.slice(1), filePath];

  return spawn(cmd, args, {
    detached: true,
    stdio: 'ignore'
  }).unref();
}

export async function createCommand(name, options) {
  console.log(chalk.bold('\n🔧 Create a new skill\n'));

  let skillName = name;
  let description = options.description;

  // Interactive mode if name not provided
  if (!skillName) {
    const answers = await prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Skill name (lowercase, hyphens allowed):',
        validate: (value) => {
          if (!value) return 'Name is required';
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Name must be lowercase with hyphens only';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Short description for auto-discovery (max 200 chars):',
        validate: (value) => {
          if (!value) return 'Description is required';
          if (value.length > 200) return 'Description must be 200 characters or less';
          return true;
        }
      }
    ]);

    skillName = answers.name;
    description = answers.description;
  }

  // Validate inputs
  if (!skillName) {
    console.error(chalk.red('Error: Skill name is required'));
    process.exit(1);
  }

  if (!description) {
    console.error(chalk.red('Error: Description is required (use -d or --description)'));
    process.exit(1);
  }

  const spinner = ora('Creating skill...').start();

  try {
    const result = await createSkill(skillName, description);
    spinner.succeed(chalk.green(`Skill '${skillName}' created!`));

    console.log(chalk.dim(`\nLocation: ${result.path}`));

    // Ask if user wants to open in editor
    const { openEditor } = await prompt({
      type: 'confirm',
      name: 'openEditor',
      message: 'Open SKILL.md in editor to write instructions?',
      initial: true
    });

    if (openEditor) {
      console.log(chalk.dim(`\nOpening ${result.skillMdPath}...\n`));
      openInEditor(result.skillMdPath);
    }

    console.log(chalk.yellow('\nWhen ready, install with:'));
    console.log(`  ${chalk.cyan(`dotai skill install ${skillName}`)}\n`);

  } catch (err) {
    spinner.fail(chalk.red(`Failed to create skill: ${err.message}`));
    process.exit(1);
  }
}
