import { join } from 'path';
import { getHomeDir } from '../lib/paths.js';

/**
 * Provider definitions with their skill paths
 * Each provider has:
 * - name: Display name
 * - id: Unique identifier
 * - globalPath: Where global skills are stored
 * - projectPath: Where project skills are stored (relative to project root)
 * - skillFile: The instruction file name (usually SKILL.md)
 * - enabled: Whether this provider is enabled by default
 * - notes: Any special handling notes
 */
export const providers = {
  'claude-code': {
    name: 'Claude Code',
    id: 'claude-code',
    globalPath: () => join(getHomeDir(), '.claude', 'skills'),
    projectPath: '.claude/skills',
    skillFile: 'SKILL.md',
    enabled: true,
    description: 'Anthropic Claude Code CLI',
    website: 'https://claude.ai/code'
  },

  'cursor': {
    name: 'Cursor',
    id: 'cursor',
    globalPath: () => join(getHomeDir(), '.cursor', 'skills'),
    projectPath: '.cursor/skills',
    skillFile: 'SKILL.md',
    enabled: true,
    description: 'Cursor AI IDE',
    website: 'https://cursor.com'
  },

  'gemini-cli': {
    name: 'Gemini CLI',
    id: 'gemini-cli',
    globalPath: () => join(getHomeDir(), '.gemini', 'skills'),
    projectPath: '.gemini/skills',
    skillFile: 'SKILL.md',
    enabled: true,
    description: 'Google Gemini CLI',
    website: 'https://geminicli.com'
  },

  'opencode': {
    name: 'OpenCode',
    id: 'opencode',
    globalPath: () => join(getHomeDir(), '.config', 'opencode', 'skill'),
    projectPath: '.opencode/skill',
    skillFile: 'SKILL.md',
    enabled: true,
    description: 'OpenCode AI coding agent',
    website: 'https://opencode.ai'
  },

  'codex-cli': {
    name: 'Codex CLI',
    id: 'codex-cli',
    globalPath: () => join(getHomeDir(), '.codex', 'skills'),
    projectPath: 'skills',
    skillFile: 'SKILL.md',
    enabled: true,
    description: 'OpenAI Codex CLI',
    website: 'https://openai.com/codex',
    // Codex also uses AGENTS.md for global instructions
    supportsAgentsMd: true,
    agentsMdGlobalPath: () => join(getHomeDir(), '.codex', 'AGENTS.md'),
    agentsMdProjectPath: 'AGENTS.md'
  },

  'antigravity': {
    name: 'Antigravity',
    id: 'antigravity',
    globalPath: () => join(getHomeDir(), '.gemini', 'antigravity', 'skills'),
    projectPath: '.agent/skills',
    skillFile: 'SKILL.md',
    enabled: true,
    description: 'Antigravity agentic system',
    website: 'https://github.com/vuralserhat86/antigravity-agentic-skills'
  }
};

/**
 * Get all provider IDs
 */
export function getProviderIds() {
  return Object.keys(providers);
}

/**
 * Get provider by ID
 */
export function getProvider(id) {
  return providers[id];
}

/**
 * Get all enabled providers
 */
export function getEnabledProviders(config = {}) {
  const enabledProviders = config.enabledProviders || getProviderIds();
  return enabledProviders.map(id => providers[id]).filter(Boolean);
}

/**
 * Get global skill path for a provider and skill name
 */
export function getGlobalSkillPath(providerId, skillName) {
  const provider = providers[providerId];
  if (!provider) return null;
  return join(provider.globalPath(), skillName);
}

/**
 * Get project skill path for a provider and skill name
 */
export function getProjectSkillPath(providerId, skillName, projectRoot = process.cwd()) {
  const provider = providers[providerId];
  if (!provider) return null;
  return join(projectRoot, provider.projectPath, skillName);
}
