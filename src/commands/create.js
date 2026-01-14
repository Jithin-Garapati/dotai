import chalk from 'chalk';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import ora from 'ora';
import { spawn, execSync } from 'child_process';
import { platform } from 'os';
import fs from 'fs-extra';
import readline from 'readline';
import { createSkill } from '../lib/skills.js';

/**
 * Read multiline input from stdin until two empty lines or Ctrl+D
 * Handles large paste operations properly by buffering input
 */
async function readMultilineInput() {
  return new Promise((resolve) => {
    const lines = [];
    let emptyLineCount = 0;
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      if (line === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          rl.close();
          return;
        }
      } else {
        emptyLineCount = 0;
      }
      lines.push(line);
    });

    rl.on('close', () => {
      // Remove trailing empty lines
      while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      const lineCount = lines.length;
      if (lineCount > 0) {
        console.log(chalk.green(`✓ Pasted ${lineCount} lines`));
      }
      resolve(lines.join('\n'));
    });

    // Handle SIGINT (Ctrl+C) gracefully
    rl.on('SIGINT', () => {
      rl.close();
    });

    // Handle errors
    rl.on('error', (err) => {
      console.error(chalk.red(`Input error: ${err.message}`));
      rl.close();
    });
  });
}

/**
 * Get the command to open a file in default editor
 */
function getEditorCommand() {
  if (process.env.EDITOR) {
    return process.env.EDITOR;
  }
  switch (platform()) {
    case 'darwin':
      return 'open -t';
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
  return spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
}

/**
 * Copy text to clipboard (cross-platform)
 */
function copyToClipboard(text) {
  try {
    if (platform() === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (platform() === 'win32') {
      execSync('clip', { input: text });
    } else {
      // Linux - try xclip or xsel
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        execSync('xsel --clipboard --input', { input: text });
      }
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Generate AI prompt for skill creation
 */
function generateAIPrompt(skillName, description, details) {
  return `Create a SKILL.md for: ${skillName}
${description}
${details}

Format: YAML frontmatter (name, description) + markdown instructions.
Keep it short and actionable (under 100 lines).`;
}

export async function createCommand(name, options) {
  console.log(chalk.bold('\n🔧 Create a new skill\n'));

  let skillName = name;
  let description = options.description;

  // Interactive mode if name not provided
  if (!skillName) {
    const { name } = await prompt({
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
    });
    skillName = name;
  }

  // Validate inputs
  if (!skillName) {
    console.error(chalk.red('Error: Skill name is required'));
    process.exit(1);
  }

  // Use provided description or generate from name
  if (!description) {
    description = skillName.replace(/-/g, ' ');
  }

  // Ask how they want to create instructions
  const { method } = await prompt({
    type: 'select',
    name: 'method',
    message: 'How do you want to write the skill instructions?',
    choices: [
      { name: 'ai', message: '🤖 Generate with AI (ChatGPT, Claude, Gemini, etc)' },
      { name: 'manual', message: '✏️  Write manually (opens editor with template)' }
    ]
  });

  if (method === 'ai') {
    const { details } = await prompt({
      type: 'input',
      name: 'details',
      message: 'What should this skill do?'
    });

    const aiPrompt = generateAIPrompt(skillName, description, details || '');

    // Try to copy to clipboard
    const copied = copyToClipboard(aiPrompt);

    if (copied) {
      console.log(chalk.green('\n✓ Prompt copied to clipboard!\n'));
    } else {
      console.log(chalk.yellow('\nPrompt:\n'));
      console.log(chalk.dim('─'.repeat(40)));
      console.log(aiPrompt);
      console.log(chalk.dim('─'.repeat(40)));
    }

    console.log('Paste into any AI (ChatGPT, Claude, Gemini, etc), then paste the result here.\n');

    const { hasContent } = await prompt({
      type: 'confirm',
      name: 'hasContent',
      message: 'Ready to paste AI-generated content?',
      initial: false
    });

    if (hasContent) {
      console.log(chalk.dim('\nPaste content, then press Enter twice:\n'));

      // Read multiline input using readline
      const content = await readMultilineInput();

      if (content && content.trim()) {
        const spinner = ora('Creating skill...').start();
        try {
          const result = await createSkill(skillName, description, '');
          // Write the pasted content directly
          await fs.writeFile(result.skillMdPath, content.trim(), 'utf-8');
          spinner.succeed(chalk.green(`Skill '${skillName}' created!`));
          console.log(chalk.dim(`Location: ${result.path}`));
          console.log(chalk.yellow('\nInstall with:'));
          console.log(`  ${chalk.cyan(`dotai skill install ${skillName}`)}\n`);
        } catch (err) {
          spinner.fail(chalk.red(`Failed: ${err.message}`));
        }
      } else {
        console.log(chalk.yellow('\nNo content provided. Creating with template instead...'));
        await createWithTemplate(skillName, description);
      }
    } else {
      console.log(chalk.dim(`\nRun again when ready: ${chalk.cyan(`dotai skill create ${skillName}`)}\n`));
    }
  } else {
    // Manual creation
    await createWithTemplate(skillName, description);
  }
}

async function createWithTemplate(skillName, description) {
  const spinner = ora('Creating skill...').start();

  try {
    const result = await createSkill(skillName, description);
    spinner.succeed(chalk.green(`Skill '${skillName}' created!`));

    console.log(chalk.dim(`\nLocation: ${result.path}`));

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
