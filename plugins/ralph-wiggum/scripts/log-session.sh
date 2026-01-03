#!/bin/bash

# Ralph Wiggum Session Logger
# Logs session data to ~/.claude/ralph-wiggum-logs/sessions.jsonl
#
# Usage: log-session.sh <state_file> <outcome> [error_reason]
#
# Arguments:
#   state_file    - Path to the ralph-loop state file
#   outcome       - One of: success, max_iterations, cancelled, error
#   error_reason  - Optional error description (for outcome=error)
#
# Log entry fields:
#   - session_id, project, project_name, task (truncated to 2000 chars)
#   - started_at, ended_at (ISO 8601 UTC), duration_seconds
#   - iterations, max_iterations, outcome, completion_promise, error_reason

set -euo pipefail

STATE_FILE="${1:-}"
OUTCOME="${2:-}"
ERROR_REASON="${3:-}"

# Check dependencies
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed" >&2
  exit 1
fi

if [[ -z "$STATE_FILE" ]] || [[ -z "$OUTCOME" ]]; then
  echo "Usage: log-session.sh <state_file> <outcome> [error_reason]" >&2
  exit 1
fi

# Validate outcome
case "$OUTCOME" in
  success|max_iterations|cancelled|error) ;;
  *)
    echo "Invalid outcome: $OUTCOME (must be: success, max_iterations, cancelled, error)" >&2
    exit 1
    ;;
esac

# Ensure log directory exists
LOG_DIR="$HOME/.claude/ralph-wiggum-logs"
LOG_FILE="$LOG_DIR/sessions.jsonl"
mkdir -p "$LOG_DIR"

# Check if state file exists
if [[ ! -f "$STATE_FILE" ]]; then
  echo "State file not found: $STATE_FILE" >&2
  exit 1
fi

# Parse markdown frontmatter (YAML between ---) and extract values
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$STATE_FILE")

SESSION_ID=$(echo "$FRONTMATTER" | grep '^session_id:' | sed 's/session_id: *//' | sed 's/^"\(.*\)"$/\1/')
DESCRIPTION=$(echo "$FRONTMATTER" | grep '^description:' | sed 's/description: *//' | sed 's/^"\(.*\)"$/\1/')
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
STARTED_AT=$(echo "$FRONTMATTER" | grep '^started_at:' | sed 's/started_at: *//' | sed 's/^"\(.*\)"$/\1/')
COMPLETION_PROMISE=$(echo "$FRONTMATTER" | grep '^completion_promise:' | sed 's/completion_promise: *//' | sed 's/^"\(.*\)"$/\1/')

# Get current timestamp for ended_at (UTC)
ENDED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Calculate duration in seconds (using UTC epoch for consistency)
DURATION_SECONDS=0
if [[ -n "$STARTED_AT" ]]; then
  # Try macOS date format first, then Linux
  START_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$STARTED_AT" "+%s" 2>/dev/null || date -d "$STARTED_AT" "+%s" 2>/dev/null || echo "")
  if [[ -n "$START_EPOCH" ]]; then
    # Use UTC epoch for consistency with UTC timestamps
    END_EPOCH=$(date -u "+%s")
    DURATION_SECONDS=$((END_EPOCH - START_EPOCH))
  fi
fi

# Get project info
PROJECT_PATH=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_PATH")

# Try to get project name from git remote if available
if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ -n "$GIT_REMOTE" ]]; then
    # Extract repo name from git URL (handles both HTTPS and SSH)
    PARSED_NAME=$(echo "$GIT_REMOTE" | sed -E 's/.*[\/:]([^\/]+)(\.git)?$/\1/' | sed 's/\.git$//')
    # Only use parsed name if it's non-empty (fallback to directory name otherwise)
    [[ -n "$PARSED_NAME" ]] && PROJECT_NAME="$PARSED_NAME"
  fi
fi

# Extract full task text (everything after the closing ---), limit to 2000 chars
TASK=$(awk '/^---$/{i++; next} i>=2' "$STATE_FILE" | head -c 2000)

# Handle null/empty values for JSON
[[ -z "$COMPLETION_PROMISE" || "$COMPLETION_PROMISE" == "null" ]] && COMPLETION_PROMISE=""
[[ -z "$ERROR_REASON" ]] && ERROR_REASON=""

# Build JSON log entry using jq for proper escaping
# Use atomic write: create temp file, write JSON, then append to log file
TEMP_ENTRY=$(mktemp)
trap "rm -f '$TEMP_ENTRY'" EXIT

jq -n -c \
  --arg session_id "$SESSION_ID" \
  --arg project "$PROJECT_PATH" \
  --arg project_name "$PROJECT_NAME" \
  --arg task "$TASK" \
  --arg started_at "$STARTED_AT" \
  --arg ended_at "$ENDED_AT" \
  --argjson duration_seconds "$DURATION_SECONDS" \
  --argjson iterations "${ITERATION:-0}" \
  --argjson max_iterations "${MAX_ITERATIONS:-0}" \
  --arg outcome "$OUTCOME" \
  --arg completion_promise "$COMPLETION_PROMISE" \
  --arg error_reason "$ERROR_REASON" \
  '{
    session_id: $session_id,
    project: $project,
    project_name: $project_name,
    task: $task,
    started_at: $started_at,
    ended_at: $ended_at,
    duration_seconds: $duration_seconds,
    iterations: $iterations,
    max_iterations: $max_iterations,
    outcome: $outcome,
    completion_promise: (if $completion_promise == "" then null else $completion_promise end),
    error_reason: (if $error_reason == "" then null else $error_reason end)
  }' > "$TEMP_ENTRY"

# Add newline for JSONL format, then atomically append
echo "" >> "$TEMP_ENTRY"
cat "$TEMP_ENTRY" >> "$LOG_FILE"

echo "📝 Session logged to $LOG_FILE"
