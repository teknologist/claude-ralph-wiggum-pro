import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

const TRANSCRIPT_DIR = join(
  homedir(),
  '.claude',
  'ralph-wiggum-pro-logs',
  'transcripts'
);

export interface IterationEntry {
  iteration: number;
  timestamp: string;
  output: string;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Get the path to the iterations file for a given loop ID.
 */
export function getIterationsFilePath(loopId: string): string {
  return join(TRANSCRIPT_DIR, `${loopId}-iterations.jsonl`);
}

/**
 * Get the path to the full transcript file for a given loop ID.
 */
export function getFullTranscriptFilePath(loopId: string): string {
  return join(TRANSCRIPT_DIR, `${loopId}-full.jsonl`);
}

/**
 * Check if iterations file exists for a given loop ID.
 */
export function hasIterations(loopId: string): boolean {
  return existsSync(getIterationsFilePath(loopId));
}

/**
 * Check if full transcript file exists for a given loop ID.
 */
export function hasFullTranscript(loopId: string): boolean {
  return existsSync(getFullTranscriptFilePath(loopId));
}

/**
 * Get iterations for a given loop ID.
 * Returns null if no iterations file exists.
 */
export function getIterations(loopId: string): IterationEntry[] | null {
  const filePath = getIterationsFilePath(loopId);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    const entries: IterationEntry[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as IterationEntry;
        entries.push(entry);
      } catch {
        // Skip malformed lines
        console.warn('Skipping malformed iteration entry:', line.slice(0, 50));
      }
    }

    return entries;
  } catch (error) {
    console.error('Failed to read iterations for loop:', loopId, error);
    return null;
  }
}

/**
 * Parse the full transcript file and extract messages.
 * The transcript is in Claude Code's internal JSONL format.
 * Returns null if file doesn't exist.
 */
export function getFullTranscript(loopId: string): TranscriptMessage[] | null {
  const filePath = getFullTranscriptFilePath(loopId);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    const messages: TranscriptMessage[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        // Claude Code transcript format: {"message": {"role": "...", "content": [...]}}
        if (entry.message?.role && entry.message?.content) {
          const role = entry.message.role as 'user' | 'assistant';
          // Extract text content from content array
          const textContent = entry.message.content
            .filter(
              (c: { type: string; text?: string }) =>
                c.type === 'text' && c.text
            )
            .map((c: { text: string }) => c.text)
            .join('\n');

          if (textContent) {
            messages.push({ role, content: textContent });
          }
        }
      } catch {
        // Skip malformed lines
        console.warn('Skipping malformed transcript entry:', line.slice(0, 50));
      }
    }

    return messages;
  } catch (error) {
    console.error('Failed to read full transcript for loop:', loopId, error);
    return null;
  }
}

/**
 * Get raw full transcript file content.
 * Returns null if file doesn't exist.
 */
export function getRawFullTranscript(loopId: string): string | null {
  const filePath = getFullTranscriptFilePath(loopId);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('Failed to read raw transcript for loop:', loopId, error);
    return null;
  }
}
