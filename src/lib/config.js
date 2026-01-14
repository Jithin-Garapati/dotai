import fs from 'fs-extra';
import { getConfigDir, getConfigFilePath, getSkillsRepoDir } from './paths.js';
import { getProviderIds } from '../providers/index.js';

const defaultConfig = {
  enabledProviders: getProviderIds(),
  defaultScope: 'global', // 'global' or 'project'
  skillsRepo: null, // Custom skills repo path (null = use default)
  createdAt: new Date().toISOString()
};

/**
 * Initialize config directory and files
 */
export async function initConfig() {
  const configDir = getConfigDir();
  const skillsRepoDir = getSkillsRepoDir();
  const configFile = getConfigFilePath();

  // Create directories
  await fs.ensureDir(configDir);
  await fs.ensureDir(skillsRepoDir);

  // Create config file if it doesn't exist
  if (!await fs.pathExists(configFile)) {
    await fs.writeJson(configFile, defaultConfig, { spaces: 2 });
  }

  return loadConfig();
}

/**
 * Load config from file
 */
export async function loadConfig() {
  const configFile = getConfigFilePath();

  if (!await fs.pathExists(configFile)) {
    return { ...defaultConfig };
  }

  try {
    const config = await fs.readJson(configFile);
    return { ...defaultConfig, ...config };
  } catch (err) {
    console.error('Error loading config:', err.message);
    return { ...defaultConfig };
  }
}

/**
 * Save config to file
 */
export async function saveConfig(config) {
  const configFile = getConfigFilePath();
  await fs.ensureDir(getConfigDir());
  await fs.writeJson(configFile, config, { spaces: 2 });
}

/**
 * Update specific config values
 */
export async function updateConfig(updates) {
  const config = await loadConfig();
  const newConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
  await saveConfig(newConfig);
  return newConfig;
}

/**
 * Enable a provider
 */
export async function enableProvider(providerId) {
  const config = await loadConfig();
  if (!config.enabledProviders.includes(providerId)) {
    config.enabledProviders.push(providerId);
    await saveConfig(config);
  }
  return config;
}

/**
 * Disable a provider
 */
export async function disableProvider(providerId) {
  const config = await loadConfig();
  config.enabledProviders = config.enabledProviders.filter(id => id !== providerId);
  await saveConfig(config);
  return config;
}
