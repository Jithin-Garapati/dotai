import chalk from 'chalk';
import Enquirer from 'enquirer';
const { prompt } = Enquirer;
import ora from 'ora';
import {
  addMcpServer,
  removeMcpServer,
  listMcpServers,
  syncMcpToAllProviders,
  getMcpInstallStatus,
  getMcpConfigPath
} from '../lib/mcp.js';
import { mcpProviders, getMcpProviderIds } from '../providers/mcp.js';

/**
 * Add an MCP server
 */
export async function mcpAddCommand(options) {
  console.log(chalk.bold('\n➕ Add MCP Server\n'));

  const answers = await prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Server name (e.g., github, filesystem):',
      validate: (value) => {
        if (!value) return 'Name is required';
        if (!/^[a-z0-9-_]+$/i.test(value)) {
          return 'Name must be alphanumeric with hyphens/underscores';
        }
        return true;
      }
    },
    {
      type: 'select',
      name: 'type',
      message: 'Server type:',
      choices: [
        { name: 'stdio', message: 'stdio - Local command (most common)' },
        { name: 'sse', message: 'sse - Server-sent events (remote)' },
        { name: 'http', message: 'http - HTTP endpoint (remote)' }
      ]
    }
  ]);

  let serverConfig = {};

  if (answers.type === 'stdio') {
    const stdioAnswers = await prompt([
      {
        type: 'input',
        name: 'command',
        message: 'Command (e.g., npx, node, python):',
        validate: (value) => value ? true : 'Command is required'
      },
      {
        type: 'input',
        name: 'args',
        message: 'Arguments (comma-separated, e.g., -y,@modelcontextprotocol/server-github):',
      },
      {
        type: 'input',
        name: 'env',
        message: 'Environment variables (KEY=value,KEY2=value2):',
      }
    ]);

    serverConfig = {
      command: stdioAnswers.command,
      args: stdioAnswers.args ? stdioAnswers.args.split(',').map(a => a.trim()) : []
    };

    if (stdioAnswers.env) {
      serverConfig.env = {};
      stdioAnswers.env.split(',').forEach(pair => {
        const [key, ...valueParts] = pair.split('=');
        if (key && valueParts.length > 0) {
          serverConfig.env[key.trim()] = valueParts.join('=').trim();
        }
      });
    }
  } else {
    // SSE or HTTP
    const remoteAnswers = await prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Server URL:',
        validate: (value) => value ? true : 'URL is required'
      },
      {
        type: 'input',
        name: 'headers',
        message: 'Headers (KEY=value,KEY2=value2):',
      }
    ]);

    serverConfig = {
      url: remoteAnswers.url
    };

    if (remoteAnswers.headers) {
      serverConfig.headers = {};
      remoteAnswers.headers.split(',').forEach(pair => {
        const [key, ...valueParts] = pair.split('=');
        if (key && valueParts.length > 0) {
          serverConfig.headers[key.trim()] = valueParts.join('=').trim();
        }
      });
    }
  }

  const spinner = ora('Adding MCP server...').start();

  try {
    await addMcpServer(answers.name, serverConfig);
    spinner.succeed(chalk.green(`Added '${answers.name}'`));

    console.log(chalk.dim(`\nStored in: ${getMcpConfigPath()}`));

    const { syncNow } = await prompt({
      type: 'confirm',
      name: 'syncNow',
      message: 'Sync to all providers now?',
      initial: true
    });

    if (syncNow) {
      await mcpSyncCommand({});
    } else {
      console.log(chalk.yellow(`\nRun ${chalk.cyan('dotai mcp sync')} to deploy to all apps\n`));
    }

  } catch (err) {
    spinner.fail(chalk.red(`Failed: ${err.message}`));
  }
}

/**
 * List MCP servers
 */
export async function mcpListCommand(options) {
  console.log(chalk.bold('\n📋 MCP Servers\n'));

  const servers = await listMcpServers();
  const serverNames = Object.keys(servers);

  if (serverNames.length === 0) {
    console.log(chalk.yellow('No MCP servers configured.'));
    console.log(`\nAdd one with: ${chalk.cyan('dotai mcp add')}\n`);
    return;
  }

  for (const name of serverNames) {
    const config = servers[name];
    console.log(chalk.bold.white(name));

    if (config.command) {
      console.log(chalk.dim(`  Command: ${config.command} ${(config.args || []).join(' ')}`));
    }
    if (config.url) {
      console.log(chalk.dim(`  URL: ${config.url}`));
    }

    if (options.verbose) {
      const status = await getMcpInstallStatus(name);
      const installed = Object.entries(status)
        .filter(([_, s]) => s.installed)
        .map(([_, s]) => s.name);

      if (installed.length > 0) {
        console.log(chalk.green(`  Synced to: ${installed.join(', ')}`));
      } else {
        console.log(chalk.yellow('  Not synced yet'));
      }
    }

    console.log('');
  }

  console.log(chalk.dim(`Total: ${serverNames.length} server(s)`));
  console.log(chalk.dim(`Config: ${getMcpConfigPath()}\n`));

  if (!options.verbose) {
    console.log(chalk.dim(`Use ${chalk.cyan('dotai mcp list -v')} to see sync status\n`));
  }
}

/**
 * Sync MCP servers to all providers
 */
export async function mcpSyncCommand(options) {
  console.log(chalk.bold('\n🔄 Sync MCP Servers\n'));

  const servers = await listMcpServers();
  const serverCount = Object.keys(servers).length;

  if (serverCount === 0) {
    console.log(chalk.yellow('No MCP servers to sync.'));
    console.log(`\nAdd one with: ${chalk.cyan('dotai mcp add')}\n`);
    return;
  }

  // Determine target providers
  let targetProviders = options.providers
    ? options.providers.split(',').map(p => p.trim())
    : getMcpProviderIds();

  console.log(chalk.dim(`Syncing ${serverCount} server(s) to ${targetProviders.length} app(s)...\n`));

  const results = await syncMcpToAllProviders(targetProviders);

  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    const provider = mcpProviders[result.providerId];
    if (result.success && result.synced > 0) {
      successCount++;
      console.log(chalk.green(`  ✓ ${provider.name}`));
      console.log(chalk.dim(`    ${result.path}`));
    } else if (result.success && result.synced === 0) {
      console.log(chalk.dim(`  - ${provider.name} (no servers)`));
    } else {
      failCount++;
      console.log(chalk.red(`  ✗ ${provider.name}: ${result.error}`));
    }
  }

  console.log('');
  if (successCount > 0) {
    console.log(chalk.green(`Synced to ${successCount} app(s)`));
  }
  if (failCount > 0) {
    console.log(chalk.red(`Failed for ${failCount} app(s)`));
  }
  console.log('');
}

/**
 * Remove an MCP server
 */
export async function mcpRemoveCommand(serverName, options) {
  console.log(chalk.bold('\n🗑️  Remove MCP Server\n'));

  // If no name provided, show picker
  if (!serverName) {
    const servers = await listMcpServers();
    const serverNames = Object.keys(servers);

    if (serverNames.length === 0) {
      console.log(chalk.yellow('No MCP servers configured.'));
      return;
    }

    const answer = await prompt({
      type: 'select',
      name: 'server',
      message: 'Select server to remove:',
      choices: serverNames.map(name => ({
        name,
        message: `${name} - ${servers[name].command || servers[name].url || 'configured'}`
      }))
    });
    serverName = answer.server;
  }

  // Confirm
  if (!options.yes) {
    const { confirm } = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: `Remove '${serverName}' from central config?`,
      initial: false
    });

    if (!confirm) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
  }

  const removed = await removeMcpServer(serverName);

  if (removed) {
    console.log(chalk.green(`\n✓ Removed '${serverName}' from central config`));
    console.log(chalk.yellow('\nNote: This does not remove from already-synced providers.'));
    console.log(chalk.dim('Run sync again to update providers, or manually remove from each app.\n'));
  } else {
    console.log(chalk.red(`Server '${serverName}' not found`));
  }
}

/**
 * Show MCP providers
 */
export async function mcpProvidersCommand() {
  console.log(chalk.bold('\n🔌 MCP Providers\n'));

  for (const provider of Object.values(mcpProviders)) {
    console.log(chalk.bold.white(provider.name) + chalk.dim(` (${provider.id})`));
    console.log(chalk.dim(`  ${provider.description}`));
    console.log(chalk.dim(`  Config: ${provider.globalPath()}`));
    console.log(chalk.dim(`  Key: ${provider.configKey}`));
    if (provider.note) {
      console.log(chalk.yellow(`  Note: ${provider.note}`));
    }
    console.log('');
  }
}
