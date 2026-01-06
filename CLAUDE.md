# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains the **Ralph Wiggum Pro** plugin for Claude Code - a self-referential iteration loop system that enables autonomous, iterative task execution.

## Development Commands

### Plugin Tests

```bash
# Run all plugin tests
cd plugins/ralph-wiggum-pro/tests && ./run-all-tests.sh

# Run a single test file
./test-session-start-hook.sh
./test-stop-hook-isolation.sh
./test-setup-ralph-loop.sh
./test-quote-preservation.sh
```

> **⚠️ MANDATORY**: After running ANY tests, you MUST run [Test Cleanup](#test-cleanup) commands. Tests pollute session logs with temp directory entries.

### Dashboard Development

```bash
cd ralph-dashboard

# Install dependencies
bun install

# Development (frontend + backend concurrently)
bun run dev

# Run only backend with hot reload
bun run dev:server

# Run only frontend dev server
bun run dev:vite

# Type checking
bun run typecheck

# Linting
bun run lint

# Unit tests
bun run test              # Single run
bun run test:watch        # Watch mode
bun run test:coverage     # With coverage

# E2E tests
bun run test:e2e          # Headless
bun run test:e2e:ui       # Interactive UI
```

> **⚠️ MANDATORY**: After running ANY tests, you MUST run [Test Cleanup](#test-cleanup) commands. Tests pollute session logs with temp directory entries.

```bash
# Production build
bun run build
bun run start             # Serve production build
```

## Architecture

### Ralph Loop Mechanism

The plugin uses Claude Code's hook system to create self-referential loops:

```
User runs /ralph-wiggum-pro:ralph-loop "task" --completion-promise "DONE"
                    ↓
        setup-ralph-loop.sh creates state file
                    ↓
        Claude works on task → tries to exit
                    ↓
        stop-hook.sh intercepts exit (Stop hook)
                    ↓
    ┌─── Promise found? ─── YES → Allow exit, log success
    │
    NO
    │
    └─── Return JSON: {"decision": "block", "prompt": "<original prompt>"}
                    ↓
        Claude Code feeds prompt back → next iteration
                    ↓
            (loop continues)
```

### Session Isolation & PPID-Based Tracking

Each Claude Code session gets a unique `CLAUDE_SESSION_ID`. The plugin uses **PPID-based session tracking** for reliable identification:

**Process Tree Walking:**
```
Claude Code (PID=35553)  ← session-start-hook writes to ppid_35553.id
├─ shell (PID=37816)     ← setup-ralph-loop's $PPID
│   └─ setup-ralph-loop (PID=37832)  ← walks UP tree to find ppid_35553.id
└─ shell (PID=38001)     ← stop-hook's $PPID (different!)
    └─ stop-hook (PID=38012)  ← also walks UP tree, syncs session ID
```

**Key Mechanisms:**
- `session-start-hook.sh` → Writes session ID to `~/.claude/ralph-wiggum-pro/sessions/ppid_{claude_code_pid}.id`
- `setup-ralph-loop.sh` → Walks process tree UP to find PPID file, reads session ID
- `stop-hook.sh` → Walks process tree, receives current session ID from hook JSON, **synchronizes** PPID file if mismatch detected

**Why PPID-based tracking?**
- Claude Code may regenerate session IDs internally (after `/clear`, context changes)
- PPID file survives these regenerations (keyed by process PID, not session ID)
- Stop hook keeps PPID file updated so subsequent loops find correct session ID

**State files** are scoped per-session in a global directory:
```
~/.claude/ralph-wiggum-pro/loops/ralph-loop.{session_id}.local.md
```

Multiple terminals can run independent loops on the same project.

### Global Directory Structure

```
~/.claude/ralph-wiggum-pro/
├── loops/                    # Active loop state files
│   └── ralph-loop.{session_id}.local.md
├── logs/
│   ├── sessions.jsonl        # Session history (JSONL format)
│   └── debug.log             # Debug output (auto-rotates at 1MB)
├── sessions/                 # PPID-based session tracking
│   └── ppid_{pid}.id         # Session ID for Claude Code process
└── transcripts/              # Iteration transcripts
    ├── {loop_id}_iter_{n}.txt
    └── {loop_id}_full.txt
```

### State File Format

State files use YAML frontmatter. **Note**: File existence = active loop (no `active` field).

```yaml
---
session_id: "abc123"
loop_id: "xK9mZ"
description: "Build a REST API..."
iteration: 5
max_iterations: 50
completion_promise: "TASK COMPLETE"
started_at: "2024-01-15T10:30:00Z"
---

The actual prompt text goes here...
```

### Dashboard Architecture

**Frontend** (`ralph-dashboard/src/`): React 19 + Vite + TailwindCSS + TanStack Query

- Components in `src/components/`
- API hooks in `src/hooks/` (useSessions, useCancelLoop, useDeleteSession)
- Auto-refresh every 5 seconds via React Query polling

**Backend** (`ralph-dashboard/server/`): Bun + Fastify

- Entry point: `server/index.ts` (CLI binary)
- Server setup: `server/server.ts`
- API routes: `server/api/` (sessions, cancel, delete)
- Services: `server/services/loop-manager.ts` (parse state files), `log-parser.ts` (parse JSONL logs)

### Session Logging

All loops are logged to `~/.claude/ralph-wiggum-pro/logs/sessions.jsonl` (JSONL format) with project, task, iterations, duration, outcome, and timestamps.

## Key Files

| File | Purpose |
|------|---------|
| `plugins/ralph-wiggum-pro/hooks/stop-hook.sh` | Intercepts exit, checks promise, syncs PPID file, feeds prompt back |
| `plugins/ralph-wiggum-pro/hooks/session-start-hook.sh` | Writes session ID to PPID file (`ppid_$PPID.id`) |
| `plugins/ralph-wiggum-pro/hooks/session-end-hook.sh` | Cleans up PPID file and orphaned state files |
| `plugins/ralph-wiggum-pro/scripts/setup-ralph-loop.sh` | Creates state file, walks process tree for session ID |
| `plugins/ralph-wiggum-pro/scripts/log-session.sh` | Logs session events to JSONL, handles rotation |
| `plugins/ralph-wiggum-pro/scripts/cancel-ralph-loop.sh` | Cancels loops programmatically |
| `ralph-dashboard/server/services/loop-manager.ts` | Parses state files, validates session data |
| `ralph-dashboard/server/services/log-parser.ts` | Parses JSONL session logs |
| `ralph-dashboard/server/services/transcript-service.ts` | Reads transcript files for dashboard display |

## Environment Variables

- `CLAUDE_SESSION_ID` - Set by Claude Code, identifies current session (may change after `/clear`)
- `CLAUDE_ENV_FILE` - Path to environment file (only available in hooks, not slash commands)
- `CLAUDE_PLUGIN_ROOT` - Base path for plugin resources
- `$PPID` - Parent process ID (used to find Claude Code's PID via process tree walking)

## Security Considerations

- **Session ID validation**: Only `[a-zA-Z0-9._-]` allowed, `..` rejected (path traversal prevention)
- **PPID validation**: Numeric check before using in file paths
- **Atomic file writes**: All file operations use `mktemp` + `mv` pattern for safe concurrent access
- **Path validation**: All paths resolved and verified to be within `~/.claude/ralph-wiggum-pro/` directory
- **Loop ID validation**: 5-character alphanumeric, internally generated (not user input)
- **Quote stripping**: Completion promise quotes handled to prevent shell expansion artifacts

## Testing Strategy

Plugin tests are bash scripts with manual assertions. Dashboard has:
- **Unit tests**: Vitest + jsdom (90%+ coverage threshold)
- **E2E tests**: Playwright (Chromium)

All tests run in CI with the test:e2e command requiring a built frontend (`bun run build` first).

### Test Cleanup

> **🚨 MANDATORY - DO NOT SKIP**: You MUST run these commands after running ANY tests (plugin bash tests OR dashboard unit/e2e tests). Failure to clean up pollutes the session logs with test data.

```bash
# Clean up test entries from session logs (removes entries from temp directories)
grep -v '/var/folders/' ~/.claude/ralph-wiggum-pro/logs/sessions.jsonl | grep -v '/tmp/' > /tmp/clean.jsonl && mv /tmp/clean.jsonl ~/.claude/ralph-wiggum-pro/logs/sessions.jsonl

# Clean up any leftover state files (global directory)
# Note: Tests run in temp directories and usually clean up, but check just in case
ls ~/.claude/ralph-wiggum-pro/loops/ralph-loop.*.local.md 2>/dev/null && rm -f ~/.claude/ralph-wiggum-pro/loops/ralph-loop.*.local.md || true
```

## Commit Workflow

**IMPORTANT**: Every commit must update `CHANGELOG.md` at the repository root.

1. Add your changes under `[Unreleased]` section
2. Use categories: `Added`, `Changed`, `Fixed`, `Removed`, `Security`
3. Follow [Keep a Changelog](https://keepachangelog.com/) format
4. When releasing a version, move unreleased items to a new version section with date

Example:
```markdown
## [Unreleased]

### Added
- New feature description

### Fixed
- Bug fix description
```
