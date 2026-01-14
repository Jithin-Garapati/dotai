import fs from 'fs-extra';
import { join, basename, dirname } from 'path';
import matter from 'gray-matter';
import { getSkillsRepoDir } from './paths.js';
import { providers, getGlobalSkillPath, getProjectSkillPath } from '../providers/index.js';

/**
 * Skill template with frontmatter
 */
export function createSkillTemplate(name, description, instructions = '') {
  return `---
name: ${name}
description: ${description}
---

# ${name}

${instructions || `Instructions for the ${name} skill.

## When to use this skill

- Use this when...
- This is helpful for...

## How to use it

Step-by-step guidance, conventions, and patterns the agent should follow.

## Examples

Include examples to help the agent understand expected behavior.
`}
`;
}

/**
 * Parse a SKILL.md file
 */
export async function parseSkillFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    return {
      name: data.name || basename(dirname(filePath)),
      description: data.description || '',
      metadata: data,
      body,
      filePath
    };
  } catch (err) {
    return null;
  }
}

/**
 * List all skills in the central repository
 */
export async function listCentralSkills() {
  const skillsDir = getSkillsRepoDir();

  if (!await fs.pathExists(skillsDir)) {
    return [];
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillMdPath = join(skillsDir, entry.name, 'SKILL.md');
      if (await fs.pathExists(skillMdPath)) {
        const skill = await parseSkillFile(skillMdPath);
        if (skill) {
          skills.push({
            ...skill,
            folder: entry.name,
            path: join(skillsDir, entry.name)
          });
        }
      }
    }
  }

  return skills;
}

/**
 * Get a skill from central repo by name
 */
export async function getCentralSkill(name) {
  const skillsDir = getSkillsRepoDir();
  const skillPath = join(skillsDir, name);
  const skillMdPath = join(skillPath, 'SKILL.md');

  if (!await fs.pathExists(skillMdPath)) {
    return null;
  }

  const skill = await parseSkillFile(skillMdPath);
  if (skill) {
    skill.folder = name;
    skill.path = skillPath;
  }

  return skill;
}

/**
 * Create a new skill in the central repository
 */
export async function createSkill(name, description, instructions = '') {
  const skillsDir = getSkillsRepoDir();
  const skillPath = join(skillsDir, name);
  const skillMdPath = join(skillPath, 'SKILL.md');

  // Check if skill already exists
  if (await fs.pathExists(skillPath)) {
    throw new Error(`Skill '${name}' already exists`);
  }

  // Create skill directory
  await fs.ensureDir(skillPath);

  // Create SKILL.md
  const content = createSkillTemplate(name, description, instructions);
  await fs.writeFile(skillMdPath, content, 'utf-8');

  return {
    name,
    description,
    path: skillPath,
    skillMdPath
  };
}

/**
 * Install a skill to a specific provider
 */
export async function installSkillToProvider(skillName, providerId, scope = 'global', projectRoot = process.cwd()) {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Get source skill
  const skill = await getCentralSkill(skillName);
  if (!skill) {
    throw new Error(`Skill '${skillName}' not found in central repository`);
  }

  // Determine target path
  const targetPath = scope === 'global'
    ? getGlobalSkillPath(providerId, skillName)
    : getProjectSkillPath(providerId, skillName, projectRoot);

  // Copy skill folder
  await fs.ensureDir(targetPath);
  await fs.copy(skill.path, targetPath, { overwrite: true });

  return {
    skillName,
    providerId,
    scope,
    targetPath
  };
}

/**
 * Install a skill to multiple providers
 */
export async function installSkill(skillName, providerIds, scope = 'global', projectRoot = process.cwd()) {
  const results = [];

  for (const providerId of providerIds) {
    try {
      const result = await installSkillToProvider(skillName, providerId, scope, projectRoot);
      results.push({ ...result, success: true });
    } catch (err) {
      results.push({
        skillName,
        providerId,
        scope,
        success: false,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Uninstall a skill from a provider
 */
export async function uninstallSkillFromProvider(skillName, providerId, scope = 'global', projectRoot = process.cwd()) {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const targetPath = scope === 'global'
    ? getGlobalSkillPath(providerId, skillName)
    : getProjectSkillPath(providerId, skillName, projectRoot);

  if (await fs.pathExists(targetPath)) {
    await fs.remove(targetPath);
    return { removed: true, path: targetPath };
  }

  return { removed: false, path: targetPath };
}

/**
 * Check where a skill is installed
 */
export async function getSkillInstallStatus(skillName) {
  const status = {};

  for (const [providerId, provider] of Object.entries(providers)) {
    const globalPath = getGlobalSkillPath(providerId, skillName);
    const projectPath = getProjectSkillPath(providerId, skillName);

    status[providerId] = {
      name: provider.name,
      global: await fs.pathExists(globalPath),
      globalPath,
      project: await fs.pathExists(projectPath),
      projectPath
    };
  }

  return status;
}

/**
 * Import a skill from an external path to central repo
 */
export async function importSkill(sourcePath) {
  const skillMdPath = join(sourcePath, 'SKILL.md');

  if (!await fs.pathExists(skillMdPath)) {
    throw new Error(`No SKILL.md found in ${sourcePath}`);
  }

  const skill = await parseSkillFile(skillMdPath);
  if (!skill) {
    throw new Error(`Failed to parse SKILL.md in ${sourcePath}`);
  }

  const skillName = skill.name || basename(sourcePath);
  const targetPath = join(getSkillsRepoDir(), skillName);

  // Copy to central repo
  await fs.copy(sourcePath, targetPath, { overwrite: true });

  return {
    name: skillName,
    path: targetPath,
    imported: true
  };
}
