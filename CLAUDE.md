# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the official Claude Code Plugins Directory - a curated collection of plugins that extend Claude Code's functionality. It contains both internal plugins developed by Anthropic and external third-party plugins.

## Structure

```
/plugins           # Internal plugins developed by Anthropic
/external_plugins  # Third-party partner plugins
```

## Plugin Architecture

Each plugin follows a standard directory structure:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json      # Required: Plugin manifest (must be here, not at root)
├── commands/            # Slash commands (.md files)
├── agents/              # Subagent definitions (.md files)
├── skills/              # Skills (subdirectories with SKILL.md)
├── hooks/
│   └── hooks.json       # Event handler configuration
├── .mcp.json            # MCP server definitions
└── README.md
```

**Critical rules:**
- Manifest (`plugin.json`) MUST be in `.claude-plugin/` directory
- Component directories (`commands/`, `agents/`, `skills/`, `hooks/`) MUST be at plugin root level
- Use kebab-case for all file and directory names
- Use `${CLAUDE_PLUGIN_ROOT}` for all internal path references (never hardcode paths)

## Component Formats

### Commands (`commands/*.md`)
```yaml
---
description: Short description for /help
argument-hint: <required-arg> [optional-arg]
allowed-tools: [Read, Glob, Grep, Bash]
---
Command instructions...
```

### Skills (`skills/skill-name/SKILL.md`)
```yaml
---
name: skill-name
description: When to use this skill (include trigger phrases)
version: 1.0.0
---
Skill guidance content...
```

### Agents (`agents/*.md`)
```yaml
---
description: Agent role and expertise
capabilities:
  - Specific task 1
---
Agent instructions...
```

### Hooks (`hooks/hooks.json`)
```json
{
  "PreToolUse": [{
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "command",
      "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate.sh"
    }]
  }]
}
```
Available events: PreToolUse, PostToolUse, Stop, SubagentStop, SessionStart, SessionEnd, UserPromptSubmit, PreCompact, Notification

### MCP Servers (`.mcp.json`)
```json
{
  "server-name": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/servers/server.js"],
    "env": { "API_KEY": "${API_KEY}" }
  }
}
```

## Key Plugins to Reference

- **`plugins/example-plugin/`** - Reference implementation showing all component types
- **`plugins/plugin-dev/`** - Comprehensive toolkit with 7 skills for plugin development
- **`plugins/hookify/`** - Pattern-based hook creation via markdown config files
- **`plugins/ralph-wiggum/`** - Self-referential iteration loops using Stop hooks

## Validation

Use the plugin-dev toolkit's utility scripts:
```bash
./validate-hook-schema.sh hooks/hooks.json
./validate-agent.sh agents/my-agent.md
./test-hook.sh my-hook.sh test-input.json
```

## Testing Plugins Locally

```bash
cc --plugin-dir /path/to/plugin-name
```

## Installation From Marketplace

```bash
/plugin install {plugin-name}@claude-plugin-directory
```

Or browse in `/plugin > Discover`
