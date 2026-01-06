import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Global paths
const RALPH_BASE_DIR = join(homedir(), '.claude', 'ralph-wiggum-pro');
const TRANSCRIPTS_DIR = join(RALPH_BASE_DIR, 'transcripts');

// Old path for backward compatibility
const OLD_TRANSCRIPTS_DIR = join(
  homedir(),
  '.claude',
  'ralph-wiggum-pro-logs',
  'transcripts'
);

/**
 * Get the primary transcripts directory path.
 */
export function getTranscriptsDir(): string {
  return TRANSCRIPTS_DIR;
}

/**
 * Get the old transcripts directory path (for backward compatibility).
 */
export function getOldTranscriptsDir(): string {
  return OLD_TRANSCRIPTS_DIR;
}

/**
 * Find a file by loop ID and suffix in transcript directories.
 * Searches both new and old directories for backward compatibility.
 *
 * File naming patterns supported:
 * - New: {session_id}-{loop_id}-{suffix}
 * - Old: {loop_id}-{suffix}
 *
 * @param loopId - The loop ID to search for
 * @param suffix - The file suffix (e.g., 'iterations.jsonl', 'full.jsonl', 'checklist.json')
 * @returns Full path to the file if found, null otherwise
 */
export function findFileByLoopId(
  loopId: string,
  suffix: string
): string | null {
  // Try new directory first
  if (existsSync(TRANSCRIPTS_DIR)) {
    const files = readdirSync(TRANSCRIPTS_DIR);
    const match = files.find(
      (f) => f.endsWith(`-${loopId}-${suffix}`) || f === `${loopId}-${suffix}`
    );
    if (match) {
      return join(TRANSCRIPTS_DIR, match);
    }
  }

  // Try old directory (backward compatibility)
  if (existsSync(OLD_TRANSCRIPTS_DIR)) {
    const files = readdirSync(OLD_TRANSCRIPTS_DIR);
    const match = files.find(
      (f) => f.endsWith(`-${loopId}-${suffix}`) || f === `${loopId}-${suffix}`
    );
    if (match) {
      return join(OLD_TRANSCRIPTS_DIR, match);
    }
  }

  return null;
}

/**
 * Check if a file exists for the given loop ID and suffix.
 *
 * @param loopId - The loop ID to check
 * @param suffix - The file suffix
 * @returns true if the file exists
 */
export function fileExistsForLoopId(loopId: string, suffix: string): boolean {
  return findFileByLoopId(loopId, suffix) !== null;
}
