import { homedir } from 'os';
import { join } from 'path';
import { platform } from 'process';

/**
 * Get the user's home directory (cross-platform)
 */
export function getHomeDir() {
  return homedir();
}

/**
 * Get the dotai config directory
 * Mac/Linux: ~/.dotai
 * Windows: %USERPROFILE%\.dotai
 */
export function getConfigDir() {
  return join(getHomeDir(), '.dotai');
}

/**
 * Get the central skills repository directory
 */
export function getSkillsRepoDir() {
  return join(getConfigDir(), 'skills');
}

/**
 * Get the config file path
 */
export function getConfigFilePath() {
  return join(getConfigDir(), 'config.json');
}

/**
 * Check if running on Windows
 */
export function isWindows() {
  return platform === 'win32';
}

/**
 * Normalize path for the current OS
 */
export function normalizePath(p) {
  if (isWindows()) {
    return p.replace(/\//g, '\\');
  }
  return p;
}

/**
 * Expand ~ to home directory
 */
export function expandHome(p) {
  if (p.startsWith('~')) {
    return join(getHomeDir(), p.slice(1));
  }
  return p;
}
