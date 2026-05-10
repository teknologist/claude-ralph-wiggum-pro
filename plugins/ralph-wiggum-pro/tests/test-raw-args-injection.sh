#!/bin/bash
# Test: RALPH_RAW_ARGS env-var entry point — shell-injection-safe prompts
#
# Regression target: when the slash-command wrapper passed `$ARGUMENTS`
# unquoted to setup-ralph-loop.sh, prompts containing common markdown
# punctuation (`(...)`, `*`, backticks, single quotes) crashed the
# enclosing shell with `parse error near ')'` or `command not found: 1`
# BEFORE the script ran. The fix routes the raw string through the
# RALPH_RAW_ARGS env var; the script's positional while-loop is skipped,
# and all flags + the prompt are extracted via regex (no shell eval).
#
# These tests invoke setup-ralph-loop.sh with RALPH_RAW_ARGS set and
# zero positional args (mimicking the new wrapper) and confirm the
# state-file frontmatter has the expected description / max_iterations
# / completion_promise.
#
# We do NOT test the actual ralph-loop runtime — only the input-parsing
# layer that the bug lived in.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP="$SCRIPT_DIR/../scripts/setup-ralph-loop.sh"

GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
NC=$'\033[0m'

PASS=0
FAIL=0

# Each test gets its own fake $HOME so loops don't collide.
ORIGINAL_HOME="$HOME"
test_dir=""

setup_test_env() {
  test_dir=$(mktemp -d -t ralph-raw-args.XXXXXX)
  export HOME="$test_dir"
  mkdir -p "$test_dir/.claude/ralph-wiggum-pro/sessions"
  # Stub a session-id PPID file the script will find via process-tree walk
  echo "test-session-$$" > "$test_dir/.claude/ralph-wiggum-pro/sessions/ppid_$PPID.id"
}

cleanup_test_env() {
  export HOME="$ORIGINAL_HOME"
  [[ -n "$test_dir" && -d "$test_dir" ]] && rm -rf "$test_dir"
  test_dir=""
}

# Run setup with given raw_args env. Returns exit code; state file path is the
# stable global location keyed by session-id.
run_setup_raw() {
  local raw_args="$1"
  RALPH_RAW_ARGS="$raw_args" bash "$SETUP" >/dev/null 2>&1
}

# Read state-file fields after a setup call.
state_file_path() {
  echo "$HOME/.claude/ralph-wiggum-pro/loops/ralph-loop.test-session-$$.local.md"
}
read_field() {
  local field="$1"
  grep "^$field:" "$(state_file_path)" 2>/dev/null \
    | head -1 \
    | sed "s/^$field: *//" \
    | sed 's/^"\(.*\)"$/\1/'
}

assert_eq() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" = "$expected" ]]; then
    echo "  ${GREEN}PASS${NC}: $label"
    PASS=$((PASS + 1))
  else
    echo "  ${RED}FAIL${NC}: $label"
    echo "    expected: [$expected]"
    echo "    actual:   [$actual]"
    FAIL=$((FAIL + 1))
  fi
}

assert_setup_ok() {
  local label="$1"
  local exit_code="$2"
  if [[ "$exit_code" -eq 0 ]]; then
    echo "  ${GREEN}PASS${NC}: $label (setup exited 0)"
    PASS=$((PASS + 1))
  else
    echo "  ${RED}FAIL${NC}: $label (setup exited $exit_code, expected 0)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Testing RALPH_RAW_ARGS env-var entry point ==="

# Case 1 — plain prompt, no special chars
setup_test_env
run_setup_raw "Simple task" --max-iterations 5
RC=$?
assert_setup_ok "plain prompt + iteration cap" "$RC"
desc=$(read_field 'description')
[[ "$desc" == Simple\ task* ]] && pass="" || pass="MISMATCH:$desc"
assert_eq "plain prompt: description starts with text" "" "$pass"
cleanup_test_env

# Case 2 — REGRESSION: prompt containing parens
# Old behavior: zsh saw `(foo)` and tried to define a function → parse error
# New behavior: env var passes through unscathed
setup_test_env
run_setup_raw "Fix the (parens) bug --max-iterations 7"
RC=$?
assert_setup_ok "prompt with (parens) does not blow up shell" "$RC"
mi=$(read_field 'max_iterations')
assert_eq "(parens) prompt: max_iterations extracted via regex" "7" "$mi"
cleanup_test_env

# Case 3 — REGRESSION: prompt containing globbing metachars
# Old behavior: zsh tried to expand `*` against $PWD files
setup_test_env
run_setup_raw "Touch all *.go files --max-iterations 3"
RC=$?
assert_setup_ok "prompt with * glob does not trigger pathname expansion" "$RC"
mi=$(read_field 'max_iterations')
assert_eq "glob prompt: max_iterations still parsed" "3" "$mi"
cleanup_test_env

# Case 4 — REGRESSION: prompt containing backticks (command substitution)
# Old behavior: zsh ran the backticked text as a subcommand
setup_test_env
run_setup_raw 'Investigate `cat /etc/passwd` behavior --max-iterations 2'
RC=$?
assert_setup_ok "prompt with backticks does not execute embedded command" "$RC"
mi=$(read_field 'max_iterations')
assert_eq "backtick prompt: max_iterations still parsed" "2" "$mi"
cleanup_test_env

# Case 5 — REGRESSION: prompt with literal $(subshell) syntax
setup_test_env
run_setup_raw 'Read $(whoami) home --max-iterations 4'
RC=$?
assert_setup_ok "prompt with \$() subshell does not expand" "$RC"
mi=$(read_field 'max_iterations')
assert_eq "subshell-syntax prompt: max_iterations parsed" "4" "$mi"
cleanup_test_env

# Case 6 — completion-promise containing spaces
setup_test_env
run_setup_raw 'Build it --completion-promise "TASK FULLY DONE" --max-iterations 9'
RC=$?
assert_setup_ok "quoted multi-word completion-promise" "$RC"
cp=$(read_field 'completion_promise')
assert_eq "completion_promise: multi-word value preserved" "TASK FULLY DONE" "$cp"
mi=$(read_field 'max_iterations')
assert_eq "max_iterations alongside completion-promise" "9" "$mi"
cleanup_test_env

# Case 7 — --prompt-file extraction in raw mode
setup_test_env
prompt_file="$test_dir/test-prompt.md"
printf '# A goal\n\nLong prompt content with (parens) and `backticks`.\n' > "$prompt_file"
run_setup_raw "--prompt-file $prompt_file --completion-promise DONE --max-iterations 11"
RC=$?
assert_setup_ok "--prompt-file extraction in raw mode" "$RC"
desc=$(read_field 'description')
# Description is a truncation of the prompt; just check it starts with file content.
case "$desc" in
  "# A goal"*) pass="OK" ;;
  *) pass="DESC:$desc" ;;
esac
assert_eq "raw mode reads file content via --prompt-file regex" "OK" "$pass"
mi=$(read_field 'max_iterations')
assert_eq "raw mode + --prompt-file: max_iterations" "11" "$mi"
cleanup_test_env

# Case 8 — empty RALPH_RAW_ARGS falls through to legacy positional mode
# (regression guard: existing terminal-quoted invocations must still work)
setup_test_env
unset RALPH_RAW_ARGS 2>/dev/null || true
bash "$SETUP" "Plain inline" "--max-iterations" "6" >/dev/null 2>&1
RC=$?
assert_setup_ok "legacy positional mode still works (no RALPH_RAW_ARGS)" "$RC"
mi=$(read_field 'max_iterations')
assert_eq "legacy mode: max_iterations parsed" "6" "$mi"
cleanup_test_env

echo ""
echo "Total: $((PASS + FAIL)) tests, $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] || exit 1
