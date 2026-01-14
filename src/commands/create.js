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
 */
async function readMultilineInput() {
  return new Promise((resolve) => {
    const lines = [];
    let emptyLineCount = 0;
    
    // Disable echo by using terminal: false
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
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
function generateAIPrompt(skillName, description, detailedDescription) {
  return `Create a SKILL.md file for an AI coding assistant skill with the following specifications:

**Skill Name:** ${skillName}
**Short Description:** ${description}

**What this skill should do:**
${detailedDescription}

---

Please generate a complete SKILL.md file with:

1. **YAML Frontmatter** at the top:
\`\`\`yaml
---
name: ${skillName}
description: ${description}
---
\`\`\`

2. **Detailed Instructions** including:
   - When to use this skill (specific scenarios/triggers)
   - Step-by-step guidance for the AI to follow
   - Best practices and conventions
   - Common pitfalls to avoid
   - Example inputs and expected outputs

3. **Format Requirements:**
   - Use clear, actionable language
   - Include code examples where relevant
   - Keep instructions concise but comprehensive
   - Use markdown formatting (headers, lists, code blocks)

Generate the complete SKILL.md content now:`;
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
      { name: 'ai', message: '🤖 Generate with AI (creates prompt for ChatGPT/Claude)' },
      { name: 'manual', message: '✏️  Write manually (opens editor with template)' }
    ]
  });

  if (method === 'ai') {
    // AI-assisted creation - use the short description as context, ask for more detail
    const { detailedDescription } = await prompt({
      type: 'input',
      name: 'detailedDescription',
      message: 'What should the AI do with this skill? (be specific):',
      validate: (value) => value.length > 10 ? true : 'Please provide more detail (at least 10 characters)'
    });

    const aiPrompt = generateAIPrompt(skillName, description, detailedDescription);

    console.log(chalk.bold('\n📋 AI Prompt Generated!\n'));

    // Try to copy to clipboard
    const copied = copyToClipboard(aiPrompt);

    if (copied) {
      console.log(chalk.green('✓ Prompt copied to clipboard!\n'));
    } else {
      console.log(chalk.yellow('Could not copy to clipboard. Here\'s the prompt:\n'));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(aiPrompt);
      console.log(chalk.dim('─'.repeat(60)));
    }

    console.log(chalk.bold('Next steps:'));
    console.log('  1. Paste this prompt into ChatGPT, Claude, or any LLM');
    console.log('  2. Copy the generated SKILL.md content');
    console.log('  3. Run this command again and paste the result\n');

    const { hasContent } = await prompt({
      type: 'confirm',
      name: 'hasContent',
      message: 'Do you have the AI-generated content ready to paste?',
      initial: false
    });

    if (hasContent) {
      console.log(chalk.dim('\nPaste the SKILL.md content below, then press Enter twice when done:\n'));

      // Read multiline input using readline
      const content = await readMultilineInput();

      if (content && content.trim()) {
        const spinner = ora('Creating skill with AI-generated content...').start();
        try {
          const result = await createSkill(skillName, description, '');
          // Write the pasted content directly
          await fs.writeFile(result.skillMdPath, content.trim(), 'utf-8');
          spinner.succeed(chalk.green(`Skill '${skillName}' created with AI content!`));
          console.log(chalk.dim(`\nLocation: ${result.path}`));
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
      console.log(chalk.dim('\nNo problem! When you have the content ready:'));
      console.log(`  1. Create the skill: ${chalk.cyan(`dotai skill create ${skillName} -d "${description}"`)}`);
      console.log(`  2. Or manually create: ${chalk.cyan(`~/.dotai/skills/${skillName}/SKILL.md`)}\n`);
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
