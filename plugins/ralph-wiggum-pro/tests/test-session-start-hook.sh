#!/bin/bash
# Test: session-start-hook.sh - Essential test suite
# Tests core functionality, security validation, and error handling

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/session-start-hook.sh"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

TESTS_RUN=0
TESTS_PASSED=0

pass() {
  echo -e "  ${GREEN}PASS${NC}: $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
  echo -e "  ${RED}FAIL${NC}: $1"
  if [[ -n "${2:-}" ]]; then
    echo "  $2"
  fi
  exit 1
}

run_test() {
  TESTS_RUN=$((TESTS_RUN + 1))
  echo ""
  echo "Test $TESTS_RUN: $1"
}

echo "=== Testing session-start-hook.sh ==="
echo "Essential test suite for session ID persistence"

# Create temp directory for test
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

# ============================================================================
# BASIC FUNCTIONALITY
# ============================================================================

run_test "Basic session ID written to CLAUDE_ENV_FILE"
ENV_FILE="$TEST_DIR/claude-env-1"
touch "$ENV_FILE"
HOOK_INPUT='{"session_id": "test-session-abc123", "cwd": "/tmp"}'
export CLAUDE_ENV_FILE="$ENV_FILE"
echo "$HOOK_INPUT" | "$HOOK_SCRIPT"

if grep -q 'export CLAUDE_SESSION_ID="test-session-abc123"' "$ENV_FILE"; then
  pass "Session ID written correctly"
else
  fail "Session ID not found in env file" "Contents: $(cat $ENV_FILE)"
fi

# ============================================================================
# SECURITY VALIDATION
# ============================================================================

run_test "Session ID with colons rejected (security)"
ENV_FILE="$TEST_DIR/claude-env-colons"
touch "$ENV_FILE"
export CLAUDE_ENV_FILE="$ENV_FILE"
echo '{"session_id": "session:10:30:45", "cwd": "/tmp"}' | "$HOOK_SCRIPT" || true

if [[ ! -s "$ENV_FILE" ]]; then
  pass "Colons in session ID correctly rejected"
else
  fail "Colons in session ID should be rejected for security" ""
fi

run_test "Session ID with path traversal (..) rejected (security)"
ENV_FILE="$TEST_DIR/claude-env-pathtraversal"
touch "$ENV_FILE"
export CLAUDE_ENV_FILE="$ENV_FILE"
echo '{"session_id": "../../../etc/passwd", "cwd": "/tmp"}' | "$HOOK_SCRIPT" || true

if [[ ! -s "$ENV_FILE" ]]; then
  pass "Path traversal session ID correctly rejected"
else
  fail "Path traversal session ID should be rejected for security" ""
fi

run_test "Whitespace-only session_id rejected (security)"
ENV_FILE="$TEST_DIR/claude-env-whitespace"
touch "$ENV_FILE"
export CLAUDE_ENV_FILE="$ENV_FILE"
echo '{"session_id": "   ", "cwd": "/tmp"}' | "$HOOK_SCRIPT" || true

if [[ ! -s "$ENV_FILE" ]]; then
  pass "Whitespace-only session ID rejected"
else
  fail "Whitespace-only session ID should be rejected" ""
fi

# ============================================================================
# ENVIRONMENT ERROR HANDLING
# ============================================================================

run_test "CLAUDE_ENV_FILE not set - should silently succeed"
unset CLAUDE_ENV_FILE
RESULT=$(echo '{"session_id": "test-123", "cwd": "/tmp"}' | "$HOOK_SCRIPT" 2>&1) || true
EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
  pass "Hook exits successfully when CLAUDE_ENV_FILE not set"
else
  fail "Hook should not fail when CLAUDE_ENV_FILE not set" "Exit code: $EXIT_CODE"
fi

run_test "CLAUDE_ENV_FILE set to empty string"
export CLAUDE_ENV_FILE=""
RESULT=$(echo '{"session_id": "test-123", "cwd": "/tmp"}' | "$HOOK_SCRIPT" 2>&1) || true
EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
  pass "Hook exits successfully when CLAUDE_ENV_FILE is empty"
else
  fail "Hook should not fail when CLAUDE_ENV_FILE is empty" "Exit code: $EXIT_CODE"
fi

# ============================================================================
# INVALID INPUT HANDLING
# ============================================================================

run_test "Invalid JSON input - malformed"
ENV_FILE="$TEST_DIR/claude-env-badjson"
touch "$ENV_FILE"
export CLAUDE_ENV_FILE="$ENV_FILE"
RESULT=$(echo 'not valid json at all' | "$HOOK_SCRIPT" 2>&1) || true

if [[ ! -s "$ENV_FILE" ]]; then
  pass "No session ID written for invalid JSON"
else
  fail "Should not write for invalid JSON" "Contents: $(cat $ENV_FILE)"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════"
if [[ $TESTS_PASSED -eq $TESTS_RUN ]]; then
  echo -e "${GREEN}All $TESTS_RUN tests passed!${NC}"
else
  echo -e "${RED}$TESTS_PASSED/$TESTS_RUN tests passed${NC}"
  exit 1
fi
