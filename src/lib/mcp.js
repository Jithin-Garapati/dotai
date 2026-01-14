import fs from 'fs-extra';
import { join } from 'path';
import { getConfigDir } from './paths.js';
import { mcpProviders, getMcpProviderIds } from '../providers/mcp.js';

/**
 * Get the central MCP config file path
 */
export function getMcpConfigPath() {
  return join(getConfigDir(), 'mcp_servers.json');
}

/**
 * Load central MCP config
 */
export async function loadMcpConfig() {
  const configPath = getMcpConfigPath();

  if (!await fs.pathExists(configPath)) {
    return { mcpServers: {} };
  }

  try {
    return await fs.readJson(configPath);
  } catch (err) {
    return { mcpServers: {} };
  }
}

/**
 * Save central MCP config
 */
export async function saveMcpConfig(config) {
  const configPath = getMcpConfigPath();
  await fs.ensureDir(getConfigDir());
  await fs.writeJson(configPath, config, { spaces: 2 });
}

/**
 * Add an MCP server to central config
 */
export async function addMcpServer(name, serverConfig) {
  const config = await loadMcpConfig();
  config.mcpServers[name] = serverConfig;
  await saveMcpConfig(config);
  return config;
}

/**
 * Remove an MCP server from central config
 */
export async function removeMcpServer(name) {
  const config = await loadMcpConfig();
  if (config.mcpServers[name]) {
    delete config.mcpServers[name];
    await saveMcpConfig(config);
    return true;
  }
  return false;
}

/**
 * List all MCP servers in central config
 */
export async function listMcpServers() {
  const config = await loadMcpConfig();
  return config.mcpServers || {};
}

/**
 * Read a provider's MCP config file
 */
export async function readProviderMcpConfig(providerId) {
  const provider = mcpProviders[providerId];
  if (!provider) return null;

  const configPath = provider.globalPath();

  if (!await fs.pathExists(configPath)) {
    return { [provider.configKey]: {} };
  }

  try {
    const content = await fs.readJson(configPath);
    return content;
  } catch (err) {
    return { [provider.configKey]: {} };
  }
}

/**
 * Write to a provider's MCP config file
 */
export async function writeProviderMcpConfig(providerId, servers) {
  const provider = mcpProviders[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const configPath = provider.globalPath();
  const configKey = provider.configKey;

  // Ensure directory exists
  await fs.ensureDir(join(configPath, '..'));

  // Read existing config to preserve other settings
  let existingConfig = {};
  if (await fs.pathExists(configPath)) {
    try {
      existingConfig = await fs.readJson(configPath);
    } catch (err) {
      existingConfig = {};
    }
  }

  // Merge MCP servers
  existingConfig[configKey] = {
    ...(existingConfig[configKey] || {}),
    ...servers
  };

  await fs.writeJson(configPath, existingConfig, { spaces: 2 });
  return configPath;
}

/**
 * Sync all MCP servers to a specific provider
 */
export async function syncMcpToProvider(providerId) {
  const provider = mcpProviders[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const servers = await listMcpServers();

  if (Object.keys(servers).length === 0) {
    return { synced: 0, path: null };
  }

  const configPath = await writeProviderMcpConfig(providerId, servers);

  return {
    synced: Object.keys(servers).length,
    path: configPath
  };
}

/**
 * Sync all MCP servers to all enabled providers
 */
export async function syncMcpToAllProviders(providerIds = null) {
  const targetProviders = providerIds || getMcpProviderIds();
  const results = [];

  for (const providerId of targetProviders) {
    try {
      const result = await syncMcpToProvider(providerId);
      results.push({
        providerId,
        success: true,
        ...result
      });
    } catch (err) {
      results.push({
        providerId,
        success: false,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Get MCP server installation status across providers
 */
export async function getMcpInstallStatus(serverName) {
  const status = {};

  for (const [providerId, provider] of Object.entries(mcpProviders)) {
    try {
      const config = await readProviderMcpConfig(providerId);
      const servers = config[provider.configKey] || {};
      status[providerId] = {
        name: provider.name,
        installed: !!servers[serverName],
        path: provider.globalPath()
      };
    } catch (err) {
      status[providerId] = {
        name: provider.name,
        installed: false,
        error: err.message
      };
    }
  }

  return status;
}
