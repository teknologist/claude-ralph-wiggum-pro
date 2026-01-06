---
description: "Explain Ralph Wiggum technique and available commands"
---

# Ralph Wiggum Plugin Help

Please explain the following to the user:

## What is the Ralph Wiggum Technique?

The Ralph Wiggum technique is an iterative development methodology based on continuous AI loops, pioneered by Geoffrey Huntley.

**Core concept:**
```bash
while :; do
  cat PROMPT.md | claude-code --continue
done
```

The same prompt is fed to Claude repeatedly. The "self-referential" aspect comes from Claude seeing its own previous work in the files and git history, not from feeding output back as input.

**Each iteration:**
1. Claude receives the SAME prompt
2. Works on the task, modifying files
3. Tries to exit
4. Stop hook intercepts and feeds the same prompt again
5. Claude sees its previous work in the files
6. Iteratively improves until completion

The technique is described as "deterministically bad in an undeterministic world" - failures are predictable, enabling systematic improvement through prompt tuning.

## Available Commands

### /ralph-wiggum-pro:ralph-loop <PROMPT> [OPTIONS]

Start a Ralph loop in your current session.

**Usage:**
```
/ralph-wiggum-pro:ralph-loop "Refactor the cache layer. Output <promise>DONE</promise> when complete." --completion-promise DONE --max-iterations 20
/ralph-wiggum-pro:ralph-loop "Add tests. Output <promise>TESTS COMPLETE</promise> when all pass." --completion-promise "TESTS COMPLETE"
```

**Options:**
- `--max-iterations <n>` - Max iterations before auto-stop
- `--completion-promise <text>` - Keyword to detect inside `<promise>` tags (quotes optional for single words)

**Critical**: Your prompt MUST include instructions to output `<promise>KEYWORD</promise>` when done. The `--completion-promise` specifies what KEYWORD to look for inside those tags.

**How it works:**
1. Creates state file at `~/.claude/ralph-wiggum-pro/loops/ralph-loop.{session_id}.local.md`
2. You work on the task
3. When you try to exit, stop hook intercepts
4. If `<promise>KEYWORD</promise>` found → loop ends
5. Otherwise, same prompt fed back
6. You see your previous work
7. Continues until promise detected or max iterations

---

### /ralph-wiggum-pro:list-ralph-loops

List all active Ralph loops across all sessions.

**Usage:**
```
/ralph-wiggum-pro:list-ralph-loops
```

**Shows:**
- Session ID (truncated)
- Task description
- Current iteration / max iterations
- Elapsed time since start

---

### /ralph-wiggum-pro:cancel-ralph

Cancel an active Ralph loop (removes the loop state file).

**Usage:**
```
/ralph-wiggum-pro:cancel-ralph
```

**How it works:**
- Checks for active loop state file at `~/.claude/ralph-wiggum-pro/loops/`
- Logs the cancellation to session history
- Removes the state file
- Reports cancellation with iteration count

---

### /ralph-wiggum-pro:ralph-stats [OPTIONS]

View historical Ralph loop session data.

**Usage:**
```
/ralph-wiggum-pro:ralph-stats                    # Show last 10 sessions
/ralph-wiggum-pro:ralph-stats --last 20          # Show last 20 sessions
/ralph-wiggum-pro:ralph-stats --project my-api   # Filter by project
/ralph-wiggum-pro:ralph-stats --outcome success  # Show only successful loops
/ralph-wiggum-pro:ralph-stats --all              # Show all sessions
```

**Options:**
- `--last N`, `-n N` - Show last N sessions (default: 10)
- `--project NAME`, `-p NAME` - Filter by project name
- `--outcome TYPE`, `-o TYPE` - Filter by outcome (success, max_iterations, cancelled, error)
- `--all`, `-a` - Show all sessions

**Shows:**
- Project name
- Task description
- Iterations completed
- Duration
- Outcome (success/max/cancel/error)
- Start and end timestamps

**Log location:** `~/.claude/ralph-wiggum-pro/logs/sessions.jsonl`

---

## Key Concepts

### Completion Promises

To signal completion, Claude must output a `<promise>` tag:

```
<promise>TASK COMPLETE</promise>
```

The stop hook looks for this specific tag. Without it (or `--max-iterations`), Ralph runs infinitely.

### Self-Reference Mechanism

The "loop" doesn't mean Claude talks to itself. It means:
- Same prompt repeated
- Claude's work persists in files
- Each iteration sees previous attempts
- Builds incrementally toward goal

## Example

### Interactive Bug Fix

```
/ralph-wiggum-pro:ralph-loop "Fix the token refresh logic in auth.ts. Output <promise>FIXED</promise> when all tests pass." --completion-promise FIXED --max-iterations 10
```

You'll see Ralph:
- Attempt fixes
- Run tests
- See failures
- Iterate on solution
- In your current session

## When to Use Ralph

**Good for:**
- Well-defined tasks with clear success criteria
- Tasks requiring iteration and refinement
- Iterative development with self-correction
- Greenfield projects

**Not good for:**
- Tasks requiring human judgment or design decisions
- One-shot operations
- Tasks with unclear success criteria
- Debugging production issues (use targeted debugging instead)

## Session Isolation

Ralph Wiggum Pro supports **multiple concurrent loops** in different Claude Code terminals:

- Each terminal gets a unique session ID
- Session IDs are tracked via PPID files (keyed by Claude Code's process ID)
- Works correctly even after `/clear` commands
- State files are isolated per session: `~/.claude/ralph-wiggum-pro/loops/ralph-loop.{session_id}.local.md`

### Dashboard

Monitor and manage all your Ralph loops from a web browser:

```bash
bunx ralph-dashboard           # Start on localhost:3847
bunx ralph-dashboard -p 8080   # Custom port
```

## Learn More

- Original technique: https://ghuntley.com/ralph/
- Ralph Orchestrator: https://github.com/mikeyobrien/ralph-orchestrator
