#!/bin/bash

# Test script for log-session.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_SCRIPT="$PLUGIN_ROOT/scripts/log-session.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Setup test environment
TEST_DIR=$(mktemp -d)
TEST_LOG_DIR="$TEST_DIR/.claude-test-logs"
ORIGINAL_HOME="$HOME"

cleanup() {
  rm -rf "$TEST_DIR"
  export HOME="$ORIGINAL_HOME"
}
trap cleanup EXIT

# Override HOME so logs go to test directory
export HOME="$TEST_DIR"

echo "📋 Testing log-session.sh"
echo "========================="
echo ""

# Helper function to run a test
run_test() {
  local test_name="$1"
  local expected_result="$2"
  shift 2

  echo -n "Testing: $test_name... "

  if eval "$@"; then
    if [[ "$expected_result" == "pass" ]]; then
      echo -e "${GREEN}✓ PASSED${NC}"
      ((TESTS_PASSED++))
      return 0
    else
      echo -e "${RED}✗ FAILED (expected failure)${NC}"
      ((TESTS_FAILED++))
      return 1
    fi
  else
    if [[ "$expected_result" == "fail" ]]; then
      echo -e "${GREEN}✓ PASSED (expected failure)${NC}"
      ((TESTS_PASSED++))
      return 0
    else
      echo -e "${RED}✗ FAILED${NC}"
      ((TESTS_FAILED++))
      return 1
    fi
  fi
}

# Test 1: Missing arguments
run_test "Missing arguments shows usage" "fail" "$LOG_SCRIPT 2>&1 | grep -q 'Usage:'"

# Test 2: Invalid outcome
run_test "Invalid outcome rejected" "fail" "$LOG_SCRIPT /tmp/fake.md invalid_outcome 2>&1 | grep -q 'Invalid outcome'"

# Test 3: Missing state file
run_test "Missing state file rejected" "fail" "$LOG_SCRIPT /tmp/nonexistent.md success 2>&1 | grep -q 'not found'"

# Test 4: Valid state file creates log entry
echo ""
echo "Testing: Valid state file creates log entry..."

# Create a test state file
mkdir -p "$TEST_DIR/.claude"
TEST_STATE_FILE="$TEST_DIR/.claude/ralph-loop.test-session.local.md"

cat > "$TEST_STATE_FILE" <<EOF
---
active: true
session_id: "test-session-123"
description: "Test task description"
iteration: 5
max_iterations: 10
completion_promise: "DONE"
started_at: "2024-01-15T10:00:00Z"
---

This is the test prompt content.
EOF

cd "$TEST_DIR"

# Run the log script
if "$LOG_SCRIPT" "$TEST_STATE_FILE" "success" 2>&1 | grep -q "Session logged"; then
  echo -e "${GREEN}✓ Log script executed successfully${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Log script failed to execute${NC}"
  ((TESTS_FAILED++))
fi

# Check if log file was created
LOG_FILE="$HOME/.claude/ralph-wiggum-pro-logs/sessions.jsonl"
if [[ -f "$LOG_FILE" ]]; then
  echo -e "${GREEN}✓ Log file created${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Log file not created${NC}"
  ((TESTS_FAILED++))
fi

# Verify JSON structure
if [[ -f "$LOG_FILE" ]]; then
  echo ""
  echo "Verifying JSON structure..."

  # Check required fields
  if jq -e '.session_id' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ session_id field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ session_id field missing${NC}"
    ((TESTS_FAILED++))
  fi

  if jq -e '.project_name' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ project_name field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ project_name field missing${NC}"
    ((TESTS_FAILED++))
  fi

  if jq -e '.task' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ task field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ task field missing${NC}"
    ((TESTS_FAILED++))
  fi

  if jq -e '.iterations' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ iterations field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ iterations field missing${NC}"
    ((TESTS_FAILED++))
  fi

  if jq -e '.outcome' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ outcome field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ outcome field missing${NC}"
    ((TESTS_FAILED++))
  fi

  if jq -e '.started_at' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ started_at field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ started_at field missing${NC}"
    ((TESTS_FAILED++))
  fi

  if jq -e '.ended_at' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ended_at field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ ended_at field missing${NC}"
    ((TESTS_FAILED++))
  fi

  if jq -e '.duration_seconds' "$LOG_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ duration_seconds field present${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ duration_seconds field missing${NC}"
    ((TESTS_FAILED++))
  fi

  # Verify outcome value
  OUTCOME=$(jq -r '.outcome' "$LOG_FILE")
  if [[ "$OUTCOME" == "success" ]]; then
    echo -e "${GREEN}✓ outcome value is correct (success)${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ outcome value incorrect: $OUTCOME${NC}"
    ((TESTS_FAILED++))
  fi

  # Show the log entry for debugging
  echo ""
  echo "Log entry content:"
  cat "$LOG_FILE"
fi

# Test 5: Error outcome with reason
echo ""
echo "Testing: Error outcome with reason..."

# Create another test state file
TEST_STATE_FILE2="$TEST_DIR/.claude/ralph-loop.test-session-2.local.md"
cat > "$TEST_STATE_FILE2" <<EOF
---
active: true
session_id: "test-session-456"
description: "Another test task"
iteration: 3
max_iterations: 0
completion_promise: null
started_at: "2024-01-15T11:00:00Z"
---

Another test prompt.
EOF

if "$LOG_SCRIPT" "$TEST_STATE_FILE2" "error" "Test error reason" 2>&1 | grep -q "Session logged"; then
  echo -e "${GREEN}✓ Error outcome logged${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Error outcome failed${NC}"
  ((TESTS_FAILED++))
fi

# Check error reason in log (use grep to skip empty lines in JSONL)
ERROR_REASON=$(grep -v '^$' "$LOG_FILE" | tail -1 | jq -r '.error_reason')
if [[ "$ERROR_REASON" == "Test error reason" ]]; then
  echo -e "${GREEN}✓ Error reason captured correctly${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Error reason incorrect: $ERROR_REASON${NC}"
  ((TESTS_FAILED++))
fi

# Summary
echo ""
echo "========================="
echo "Test Summary"
echo "========================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -gt 0 ]]; then
  exit 1
fi

exit 0
