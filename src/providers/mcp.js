import { join } from 'path';
import { homedir, platform } from 'os';

/**
 * MCP Server provider definitions
 * Each provider has different config file locations and formats
 */
export const mcpProviders = {
  'claude-code': {
    name: 'Claude Code',
    id: 'claude-code',
    globalPath: () => join(homedir(), '.claude.json'),
    projectPath: '.mcp.json',
    configKey: 'mcpServers',
    format: 'json',
    enabled: true,
    description: 'Anthropic Claude Code CLI'
  },

  'claude-desktop': {
    name: 'Claude Desktop',
    id: 'claude-desktop',
    globalPath: () => {
      if (platform() === 'win32') {
        return join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
      }
      return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    },
    projectPath: null, // No project-level config
    configKey: 'mcpServers',
    format: 'json',
    enabled: true,
    description: 'Claude Desktop App'
  },

  'cursor': {
    name: 'Cursor',
    id: 'cursor',
    globalPath: () => join(homedir(), '.cursor', 'mcp.json'),
    projectPath: '.cursor/mcp.json',
    configKey: 'mcpServers',
    format: 'json',
    enabled: true,
    description: 'Cursor AI IDE'
  },

  'windsurf': {
    name: 'Windsurf',
    id: 'windsurf',
    globalPath: () => join(homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    projectPath: null,
    configKey: 'mcpServers',
    format: 'json',
    enabled: true,
    description: 'Windsurf IDE by Codeium'
  },

  'vscode': {
    name: 'VS Code',
    id: 'vscode',
    globalPath: () => {
      // VS Code stores in different locations per OS
      if (platform() === 'win32') {
        return join(process.env.APPDATA || '', 'Code', 'User', 'settings.json');
      } else if (platform() === 'darwin') {
        return join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
      }
      return join(homedir(), '.config', 'Code', 'User', 'settings.json');
    },
    projectPath: '.vscode/mcp.json',
    configKey: 'mcpServers', // For project config; global uses mcp.servers in settings
    globalConfigKey: 'mcp.servers', // Different key for global settings.json
    format: 'json',
    enabled: true,
    description: 'Visual Studio Code with GitHub Copilot'
  },

  'cline': {
    name: 'Cline',
    id: 'cline',
    globalPath: () => {
      // Cline stores in VS Code extension storage
      if (platform() === 'win32') {
        return join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
      } else if (platform() === 'darwin') {
        return join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
      }
      return join(homedir(), '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
    },
    projectPath: null,
    configKey: 'mcpServers',
    format: 'json',
    enabled: true,
    description: 'Cline VS Code Extension'
  },

  'zed': {
    name: 'Zed',
    id: 'zed',
    globalPath: () => {
      if (platform() === 'darwin') {
        return join(homedir(), '.config', 'zed', 'settings.json');
      }
      return join(homedir(), '.config', 'zed', 'settings.json');
    },
    projectPath: null,
    configKey: 'context_servers', // Zed uses different key!
    format: 'json',
    enabled: true,
    description: 'Zed Editor'
  },

  'roo-code': {
    name: 'Roo Code',
    id: 'roo-code',
    globalPath: () => {
      if (platform() === 'win32') {
        return join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'mcp_settings.json');
      } else if (platform() === 'darwin') {
        return join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'mcp_settings.json');
      }
      return join(homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'mcp_settings.json');
    },
    projectPath: '.roo/mcp.json',
    configKey: 'mcpServers',
    format: 'json',
    enabled: true,
    description: 'Roo Code VS Code Extension'
  },

  'antigravity': {
    name: 'Antigravity',
    id: 'antigravity',
    globalPath: () => {
      // Antigravity stores MCP config in its own location
      // Access via MCP Store > Manage MCP Servers > View raw config
      if (platform() === 'darwin') {
        return join(homedir(), '.antigravity', 'mcp_config.json');
      }
      return join(homedir(), '.antigravity', 'mcp_config.json');
    },
    projectPath: null,
    configKey: 'mcpServers',
    format: 'json',
    enabled: true,
    description: 'Antigravity Editor',
    note: 'Config accessible via MCP Store > Manage MCP Servers > View raw config'
  }
};

/**
 * Get all MCP provider IDs
 */
export function getMcpProviderIds() {
  return Object.keys(mcpProviders);
}

/**
 * Get MCP provider by ID
 */
export function getMcpProvider(id) {
  return mcpProviders[id];
}

/**
 * Get all enabled MCP providers
 */
export function getEnabledMcpProviders(config = {}) {
  const enabledProviders = config.enabledMcpProviders || getMcpProviderIds();
  return enabledProviders.map(id => mcpProviders[id]).filter(Boolean);
}

/**
 * Standard MCP server config format (most providers use this)
 */
export function createMcpServerConfig(name, command, args = [], env = {}) {
  return {
    [name]: {
      command,
      args,
      ...(Object.keys(env).length > 0 ? { env } : {})
    }
  };
}
