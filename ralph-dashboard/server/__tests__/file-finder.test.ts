import { describe, it, expect } from 'vitest';
import {
  getTranscriptsDir,
  getOldTranscriptsDir,
  fileExistsForLoopId,
} from '../services/file-finder';
import { homedir } from 'os';

describe('file-finder', () => {
  describe('getTranscriptsDir', () => {
    it('should return the expected transcripts directory path', () => {
      const expected = `${homedir()}/.claude/ralph-wiggum-pro/transcripts`;
      expect(getTranscriptsDir()).toBe(expected);
    });
  });

  describe('getOldTranscriptsDir', () => {
    it('should return the old transcripts directory path', () => {
      const expected = `${homedir()}/.claude/ralph-wiggum-pro-logs/transcripts`;
      expect(getOldTranscriptsDir()).toBe(expected);
    });
  });

  describe('fileExistsForLoopId', () => {
    it('should return false when file does not exist', () => {
      // Use a loop ID that definitely doesn't exist
      const result = fileExistsForLoopId(
        'nonexistent-loop-id',
        'iterations.jsonl'
      );
      expect(result).toBe(false);
    });
  });
});
