#!/bin/bash
# Test: completion-promise extraction regex
#
# Locks in the regex used at hooks/stop-hook.sh to pull <promise>X</promise>
# out of the joined assistant text.
#
# Regression target: an earlier prose mention of <promise> with no closing
# tag on the same line MUST NOT hijack the capture and prevent the loop
# from exiting on a later real emit. (See L-2026-05-09 in cocoon-family
# harness lessons for the originating incident.)
#
# Regex contract:
#   * GREEDY leading `.*` — last <promise>...</promise> pair in the text wins
#     (preserves crash-recovery: a promise in any earlier message still
#     detects, even if the agent kept writing after).
#   * `[^<]*` capture — captured content cannot contain `<`, so a stray
#     <promise> opening tag (no close on the same line) cannot have its
#     capture span across the real completion emit.
#
# These cases are unit-style: they invoke the same Perl one-liner the
# hook uses, against synthetic strings.

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0

extract_promise() {
  printf '%s' "$1" | perl -0777 -pe '
    s/.*<promise>([^<]*)<\/promise>.*/$1/s;
    s/^\s+|\s+$//g;
    s/\s+/ /g;
  '
}

assert_eq() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" = "$expected" ]]; then
    echo -e "  ${GREEN}PASS${NC}: $label"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}FAIL${NC}: $label"
    echo "    expected: [$expected]"
    echo "    actual:   [$actual]"
    FAIL=$((FAIL + 1))
  fi
}

# When the regex doesn't match (no clean <promise>X</promise> pair anywhere),
# perl -pe leaves the input as-is. The hook then compares the (long) string
# to COMPLETION_PROMISE and the comparison fails — loop continues. To assert
# "no clean pair found", we check that the output equals the input.
assert_no_clean_pair() {
  local label="$1"
  local input="$2"
  local actual
  actual=$(extract_promise "$input")
  # Normalize input the same way perl normalizes (trim + collapse) for fair compare
  local normalized
  normalized=$(printf '%s' "$input" | perl -0777 -pe 's/^\s+|\s+$//g; s/\s+/ /g;')
  if [[ "$actual" = "$normalized" ]]; then
    echo -e "  ${GREEN}PASS${NC}: $label"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}FAIL${NC}: $label"
    echo "    expected unchanged-input (no clean pair), got extraction: [$actual]"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Testing completion-promise regex (stop-hook.sh) ==="

# --- Cases the hook should treat as completion (regex returns the promise) ---

got=$(extract_promise "Done.

<promise>G-0001 COMPLETE</promise>
")
assert_eq "clean emit at message tail" "G-0001 COMPLETE" "$got"

got=$(extract_promise "I will output <promise>...</promise> when done.
Work is complete.
<promise>G-0001 COMPLETE</promise>
")
assert_eq "earlier prose pair + real emit at tail (last wins)" "G-0001 COMPLETE" "$got"

# Crash-recovery: promise emitted in iter-N, narrative continues in iter-N+1.
# Ralph's design intent (test-stop-hook-isolation.sh test 16) requires that
# the LAST clean pair still detects, even if the agent wrote more text after.
got=$(extract_promise "<promise>DONE</promise> Task completed.
Here are the final results...
")
assert_eq "promise in early message, narrative after — still detects" "DONE" "$got"

# REGRESSION GUARD: prose mention with stray opening, then real emit.
# Old regex: .*?<promise>(.*?)</promise> would match the stray opening and
# greedily span to the next </promise>, capturing several lines of prose.
# New regex: [^<]* in capture forbids spanning across other tags; .* greedy
# walks to the LAST clean <promise>X</promise> pair where X has no '<'.
got=$(extract_promise "I plan to add a stable \`<promise>\` keyword section to the goal.

Later in iteration 2:

<promise>G-0001 COMPLETE</promise>
")
assert_eq "stray <promise> opening in prose does NOT poison capture" "G-0001 COMPLETE" "$got"

# Multiple intact pairs: last one wins.
got=$(extract_promise "Earlier: <promise>WIP</promise>.
Now: <promise>FINAL DONE</promise>
")
assert_eq "multiple intact pairs — last wins" "FINAL DONE" "$got"

# Trailing markdown noise around the closing tag — emit still extractable.
got=$(extract_promise "Goal done.

\`<promise>G-0001 COMPLETE</promise>\`
")
assert_eq "trailing backticks (code-formatted emit)" "G-0001 COMPLETE" "$got"

# Promise with surrounding whitespace inside the tag.
got=$(extract_promise "<promise>  TASK DONE  </promise>")
assert_eq "internal whitespace trimmed and collapsed" "TASK DONE" "$got"

# --- Cases the hook must NOT treat as completion ---

# A `<promise>...</promise>` with three dots inside is itself a clean pair —
# the regex extracts "...". The hook then string-compares to COMPLETION_PROMISE
# (e.g. "G-0001 COMPLETE") and continues the loop. We test the regex output
# here; the inequality is the real safety net.
got=$(extract_promise "I describe the syntax: <promise>...</promise>")
assert_eq "literal '...' placeholder extracted (string-compare rejects)" "..." "$got"

# Truly no promise pair anywhere → input passes through unchanged.
assert_no_clean_pair "no promise tag at all" "I am working on the task. Still iterating."

# Stray opening tag, no close anywhere → input passes through unchanged.
assert_no_clean_pair "stray opening tag, no closing tag" "Mention of <promise> with no closing."

# Stray closing tag, no open → input passes through unchanged.
assert_no_clean_pair "stray closing tag, no opening tag" "An orphan </promise> appears."

echo ""
echo "Total: $((PASS + FAIL)) tests, $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] || exit 1
