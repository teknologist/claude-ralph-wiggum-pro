#!/bin/bash

# Ralph Wiggum Session End Hook
# Cleans up when a Claude Code session ends (terminal closed)
# Logs abandoned loops and deletes state files

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

# Global paths
RALPH_BASE_DIR="$HOME/.claude/ralph-wiggum-pro"
LOOPS_DIR="$RALPH_BASE_DIR/loops"
LOGS_DIR="$RALPH_BASE_DIR/logs"
DEBUG_LOG="$LOGS_DIR/debug.log"

# Ensure directories exist
mkdir -p "$LOOPS_DIR" "$LOGS_DIR"

# Maximum debug log size (1MB)
MAX_DEBUG_LOG_SIZE=1048576

# Rotate debug log if it exceeds maximum size
rotate_debug_log_if_needed() {
  if [[ -f "$DEBUG_LOG" ]]; then
    local size
    size=$(stat -f%z "$DEBUG_LOG" 2>/dev/null || stat -c%s "$DEBUG_LOG" 2>/dev/null || echo "0")
    if [[ "$size" -gt "$MAX_DEBUG_LOG_SIZE" ]]; then
      # Keep last 5000 lines (approximately 500KB)
      tail -n 5000 "$DEBUG_LOG" > "${DEBUG_LOG}.tmp" 2>/dev/null && \
        mv "${DEBUG_LOG}.tmp" "$DEBUG_LOG" 2>/dev/null || true
    fi
  fi
}

# Debug logging helper (with auto-rotation)
debug_log() {
  local msg="$1"
  rotate_debug_log_if_needed
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] session-end-hook: $msg" >> "$DEBUG_LOG"
}

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Extract session ID from hook input
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')

debug_log "=== SESSION END HOOK INVOKED ==="
debug_log "session_id=$SESSION_ID"

if [[ -z "$SESSION_ID" ]]; then
  # No session ID available - nothing to clean up
  debug_log "EXIT: No session_id in hook input"
  exit 0
fi

# Security: Validate session ID format to prevent path traversal
if [[ ! "$SESSION_ID" =~ ^[a-zA-Z0-9._-]+$ ]] || [[ "$SESSION_ID" == *".."* ]]; then
  debug_log "EXIT: Invalid session_id format (security check): $SESSION_ID"
  exit 0
fi

# Direct state file lookup
STATE_FILE="$LOOPS_DIR/ralph-loop.${SESSION_ID}.local.md"
debug_log "State file path: $STATE_FILE"

if [[ ! -f "$STATE_FILE" ]]; then
  # No active loop for this session - nothing to do
  debug_log "EXIT: No state file found - no active loop to clean up"
  exit 0
fi

debug_log "Found active loop state file - logging as abandoned"

# Log the session as abandoned
if ! "$PLUGIN_ROOT/scripts/log-session.sh" "$STATE_FILE" "abandoned" "Session ended" 2>>"$DEBUG_LOG"; then
  debug_log "WARNING: Failed to log session as abandoned"
fi

# Delete the state file
if rm -f "$STATE_FILE" 2>>"$DEBUG_LOG"; then
  debug_log "State file deleted: $STATE_FILE"
else
  debug_log "WARNING: Failed to delete state file: $STATE_FILE"
fi

exit 0
