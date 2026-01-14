# dotai

**Dotfiles for AI** - Manage skills and MCP servers across all your AI coding assistants from one place.

```bash
npm install -g dotai
```

## Why dotai?

You use multiple AI coding assistants - Claude Code, Cursor, Gemini CLI, Codex, etc. Each has its own config location for skills and MCP servers. **dotai** lets you configure once and sync everywhere.

## Features

- **Skills Management** - Create, install, and sync skills across providers
- **MCP Servers** - Configure once, deploy to all apps *(coming soon)*
- **AI-Assisted Creation** - Generate skills with LLM prompts
- **Cross-Platform** - Works on Mac, Windows, and Linux

## Quick Start

```bash
# Create a skill (opens editor for full instructions)
dotai skill create

# Install to all your AI assistants
dotai skill install my-skill

# List your skills
dotai skill list

# Sync everything
dotai skill sync
```

## Supported Providers

### Skills
| Provider | Global Path | Project Path |
|----------|-------------|--------------|
| Claude Code | `~/.claude/skills/<name>/` | `.claude/skills/<name>/` |
| Cursor | `~/.cursor/skills/<name>/` | `.cursor/skills/<name>/` |
| Gemini CLI | `~/.gemini/skills/<name>/` | `.gemini/skills/<name>/` |
| OpenCode | `~/.config/opencode/skill/<name>/` | `.opencode/skill/<name>/` |
| Codex CLI | `~/.codex/skills/<name>/` | `skills/<name>/` |
| Antigravity | `~/.gemini/antigravity/skills/<name>/` | `.agent/skills/<name>/` |

### MCP Servers *(coming soon)*
| App | Global Config | Project Config |
|-----|---------------|----------------|
| Claude Code | `~/.claude.json` | `.mcp.json` |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | - |
| Cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | - |
| VS Code | User `settings.json` | `.vscode/mcp.json` |
| Cline | VS Code storage `cline_mcp_settings.json` | - |
| Zed | `~/.config/zed/settings.json` (key: `context_servers`) | - |
| Roo Code | VS Code storage `mcp_settings.json` | `.roo/mcp.json` |
| Antigravity | `mcp_config.json` (via MCP Store) | - |

## Commands

### Skills

```bash
# Create a new skill
dotai skill create [name]
dotai skill create my-skill -d "Short description"

# Install skill to providers
dotai skill install <name>              # Install to enabled providers
dotai skill install <name> -a           # Install to ALL providers
dotai skill install <name> -p claude-code,cursor  # Specific providers
dotai skill install <name> --project    # Project scope instead of global
dotai skill install /path/to/skill      # Import from external path

# List skills
dotai skill list                        # List all skills
dotai skill list -v                     # With installation status

# Sync all skills
dotai skill sync                        # Sync to enabled providers
dotai skill sync -a                     # Sync to all providers

# Uninstall
dotai skill uninstall <name>
dotai skill uninstall <name> -y         # Skip confirmation

# Open in editor/finder
dotai skill open <name>                 # Open folder
dotai skill open <name> -f              # Open SKILL.md file
```

### MCP Servers *(coming soon)*

```bash
dotai mcp add                           # Add an MCP server
dotai mcp list                          # List configured servers
dotai mcp sync                          # Sync to all apps
dotai mcp remove <name>                 # Remove a server
```

### Configuration

```bash
dotai providers                         # List supported providers
dotai config                            # Interactive configuration
dotai config -s                         # Show current config
dotai enable <provider>                 # Enable a provider
dotai disable <provider>                # Disable a provider
dotai repo                              # Open dotai folder
```

## Creating Skills with AI

When you run `dotai skill create`, it:

1. Asks for skill name and description
2. Creates the skill folder with a template
3. Opens SKILL.md in your editor

**Pro tip:** Describe what you want the skill to do to any LLM (ChatGPT, Claude, etc.) and ask it to generate the SKILL.md content. Then paste it into the file.

Example prompt:
```
Create a SKILL.md file for an AI coding assistant skill that helps with
database migrations. It should include best practices for writing migrations,
rollback strategies, and common pitfalls to avoid. Use YAML frontmatter with
name and description fields.
```

## Skill Structure

```
my-skill/
├── SKILL.md           # Required: Instructions for the AI
├── scripts/           # Optional: Helper scripts
├── references/        # Optional: Documentation
└── templates/         # Optional: Code templates
```

### SKILL.md Format

```markdown
---
name: my-skill
description: Short description for auto-discovery (max 200 chars)
---

# My Skill

Detailed instructions for the AI agent.

## When to use this skill

- Scenario 1
- Scenario 2

## Instructions

Step-by-step guidance...

## Examples

Show expected inputs/outputs...
```

## Data Location

All your configurations are stored in `~/.dotai/`:

```
~/.dotai/
├── config.json        # Your settings
└── skills/            # Central skill repository
    ├── my-skill/
    └── another-skill/
```

## License

MIT

---

Built by [Jithin Garapati](https://github.com/jithin-garapati)
