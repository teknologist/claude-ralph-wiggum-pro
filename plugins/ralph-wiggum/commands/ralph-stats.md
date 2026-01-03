---
description: "Show Ralph Wiggum loop session history and statistics"
argument-hint: "[--last N] [--project NAME] [--outcome TYPE] [--all]"
allowed-tools: ["Bash"]
hide-from-slash-command-tool: "true"
---

# Ralph Stats

Show historical Ralph loop session data from `~/.claude/ralph-wiggum-logs/sessions.jsonl`.

## Parse Arguments

The user may provide arguments. Parse them:
- `--last N` or `-n N`: Show last N sessions (default: 10)
- `--project NAME` or `-p NAME`: Filter by project name (partial match)
- `--outcome TYPE` or `-o TYPE`: Filter by outcome (success, max_iterations, cancelled, error)
- `--all` or `-a`: Show all sessions (overrides --last)

## Execute Query

```!
LOG_FILE="$HOME/.claude/ralph-wiggum-logs/sessions.jsonl"

if [[ ! -f "$LOG_FILE" ]]; then
  echo "NO_LOG_FILE"
  exit 0
fi

if [[ ! -s "$LOG_FILE" ]]; then
  echo "EMPTY_LOG_FILE"
  exit 0
fi

# Output raw JSONL for parsing
echo "LOG_DATA_START"
cat "$LOG_FILE"
echo ""
echo "LOG_DATA_END"
```

## Format and Display Results

Based on the output above:

### If NO_LOG_FILE or EMPTY_LOG_FILE
Say: "No Ralph loop history found. Run some loops first!"

### If LOG_DATA found
Parse the JSONL data between LOG_DATA_START and LOG_DATA_END. Each line is a JSON object.

Apply any filters the user requested:
- If `--project` specified, filter entries where `project_name` contains the value (case-insensitive)
- If `--outcome` specified, filter entries where `outcome` equals the value
- If `--all` NOT specified, limit to the last N entries (default 10)

Sort by `ended_at` descending (most recent first).

Display in this format:

```
📊 Ralph Loop Session History
═════════════════════════════════════════════════════════════════════════════════════════════════════════

Project         Task                           Iters/Max  Duration  Promise      Outcome     Started              Ended
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
my-api          Build REST API for todos...    15/50      1h 15m    COMPLETE     ✅ success  2024-01-15 10:30     2024-01-15 11:45
my-api          Fix auth bug                   20/20      45m       FIXED        ⏹ max      2024-01-14 14:00     2024-01-14 14:45
frontend        Refactor cache layer           8/∞        30m       -            🚫 cancel  2024-01-13 09:15     2024-01-13 09:45
my-api          Add rate limiting              3/10       5m        DONE         ❌ error    2024-01-12 16:20     2024-01-12 16:25

═════════════════════════════════════════════════════════════════════════════════════════════════════════
Total: 4 sessions | ✅ 1 | ⏹ 1 | 🚫 1 | ❌ 1
```

**Formatting rules:**
- Project: First 15 chars, truncated with `...` if longer
- Task: First 30 chars, truncated with `...` if longer
- Iters/Max: Show as `X/Y` where Y is max_iterations, or `X/∞` if max_iterations is 0 (unlimited)
- Duration: Format `duration_seconds` as:
  - `Xh Ym` if >= 1 hour
  - `Xm` if >= 1 minute but < 1 hour
  - `Xs` if < 1 minute
- Promise: Show `completion_promise` value (first 12 chars), or `-` if null/empty
- Outcome with emoji:
  - `success` → `✅ success`
  - `max_iterations` → `⏹ max`
  - `cancelled` → `🚫 cancel`
  - `error` → `❌ error`
- Started: Format `started_at` as `YYYY-MM-DD HH:MM` in local time
- Ended: Format `ended_at` as `YYYY-MM-DD HH:MM` in local time

**Summary line:**
Count total sessions and breakdown by outcome type.

### If no sessions match filters
Say: "No sessions found matching your filters."

## Additional Help

If user runs `/ralph-stats --help` or `/ralph-stats -h`, show:

```
📊 Ralph Stats - View loop session history

USAGE:
  /ralph-stats [OPTIONS]

OPTIONS:
  --last N, -n N         Show last N sessions (default: 10)
  --project NAME, -p NAME  Filter by project name
  --outcome TYPE, -o TYPE  Filter by outcome (success, max_iterations, cancelled, error)
  --all, -a              Show all sessions
  -h, --help             Show this help

EXAMPLES:
  /ralph-stats                          # Show last 10 sessions
  /ralph-stats --last 20                # Show last 20 sessions
  /ralph-stats --project my-api         # Filter by project
  /ralph-stats --outcome success        # Show only successful loops
  /ralph-stats --all --outcome error    # Show all error sessions

LOG LOCATION:
  ~/.claude/ralph-wiggum-logs/sessions.jsonl
```
