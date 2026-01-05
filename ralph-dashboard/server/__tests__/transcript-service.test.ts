import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock the fs module
vi.mock('fs');
vi.mock('os');
vi.mock('path');

// Import after mocking
import {
  getIterationsFilePath,
  getFullTranscriptFilePath,
  hasIterations,
  hasFullTranscript,
  getIterations,
  getFullTranscript,
  getRawFullTranscript,
} from '../services/transcript-service';

describe('transcript-service', () => {
  const mockHomedir = '/home/testuser';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(os.homedir).mockReturnValue(mockHomedir);
    vi.mocked(path.join).mockImplementation((...args: string[]) =>
      args.join('/')
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getIterationsFilePath', () => {
    it('returns correct path for loop ID', () => {
      const result = getIterationsFilePath('loop-123');
      expect(result).toContain('loop-123-iterations.jsonl');
    });
  });

  describe('getFullTranscriptFilePath', () => {
    it('returns correct path for loop ID', () => {
      const result = getFullTranscriptFilePath('loop-456');
      expect(result).toContain('loop-456-full.jsonl');
    });
  });

  describe('hasIterations', () => {
    it('returns true when file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      expect(hasIterations('loop-123')).toBe(true);
    });

    it('returns false when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(hasIterations('loop-123')).toBe(false);
    });
  });

  describe('hasFullTranscript', () => {
    it('returns true when file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      expect(hasFullTranscript('loop-123')).toBe(true);
    });

    it('returns false when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(hasFullTranscript('loop-123')).toBe(false);
    });
  });

  describe('getIterations', () => {
    it('returns null when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(getIterations('loop-123')).toBeNull();
    });

    it('returns parsed iterations when file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent = [
        '{"iteration": 1, "timestamp": "2024-01-15T10:00:00Z", "output": "First output"}',
        '{"iteration": 2, "timestamp": "2024-01-15T10:30:00Z", "output": "Second output"}',
      ].join('\n');
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getIterations('loop-123');

      expect(result).toHaveLength(2);
      expect(result![0]).toEqual({
        iteration: 1,
        timestamp: '2024-01-15T10:00:00Z',
        output: 'First output',
      });
      expect(result![1]).toEqual({
        iteration: 2,
        timestamp: '2024-01-15T10:30:00Z',
        output: 'Second output',
      });
    });

    it('skips malformed lines', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent = [
        '{"iteration": 1, "timestamp": "2024-01-15T10:00:00Z", "output": "First output"}',
        'not valid json',
        '{"iteration": 2, "timestamp": "2024-01-15T10:30:00Z", "output": "Second output"}',
      ].join('\n');
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = getIterations('loop-123');

      expect(result).toHaveLength(2);
      expect(warnSpy).toHaveBeenCalledWith(
        'Skipping malformed iteration entry:',
        expect.any(String)
      );
      warnSpy.mockRestore();
    });

    it('returns null on read error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      expect(getIterations('loop-123')).toBeNull();
    });

    it('handles empty lines', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent = [
        '{"iteration": 1, "timestamp": "2024-01-15T10:00:00Z", "output": "First output"}',
        '',
        '   ',
        '{"iteration": 2, "timestamp": "2024-01-15T10:30:00Z", "output": "Second output"}',
      ].join('\n');
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getIterations('loop-123');
      expect(result).toHaveLength(2);
    });
  });

  describe('getFullTranscript', () => {
    it('returns null when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(getFullTranscript('loop-123')).toBeNull();
    });

    it('returns parsed messages when file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent = [
        '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}}',
        '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hi there!"}]}}',
      ].join('\n');
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getFullTranscript('loop-123');

      expect(result).toHaveLength(2);
      expect(result![0]).toEqual({ role: 'user', content: 'Hello' });
      expect(result![1]).toEqual({ role: 'assistant', content: 'Hi there!' });
    });

    it('joins multiple text content blocks', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent =
        '{"message": {"role": "assistant", "content": [{"type": "text", "text": "First part"}, {"type": "text", "text": "Second part"}]}}';
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getFullTranscript('loop-123');

      expect(result).toHaveLength(1);
      expect(result![0].content).toBe('First part\nSecond part');
    });

    it('filters out non-text content', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent =
        '{"message": {"role": "assistant", "content": [{"type": "tool_use", "name": "test"}, {"type": "text", "text": "Result"}]}}';
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getFullTranscript('loop-123');

      expect(result).toHaveLength(1);
      expect(result![0].content).toBe('Result');
    });

    it('skips entries without text content', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent = [
        '{"message": {"role": "assistant", "content": [{"type": "tool_use", "name": "test"}]}}',
        '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}}',
      ].join('\n');
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getFullTranscript('loop-123');

      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({ role: 'user', content: 'Hello' });
    });

    it('skips entries without message or content', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent = [
        '{"other": "data"}',
        '{"message": {}}',
        '{"message": {"role": "user"}}',
        '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}}',
      ].join('\n');
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getFullTranscript('loop-123');

      expect(result).toHaveLength(1);
    });

    it('skips malformed JSON lines', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const jsonlContent = [
        'not json',
        '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}}',
      ].join('\n');
      vi.mocked(fs.readFileSync).mockReturnValue(jsonlContent);

      const result = getFullTranscript('loop-123');

      expect(result).toHaveLength(1);
    });

    it('returns null on read error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      expect(getFullTranscript('loop-123')).toBeNull();
    });
  });

  describe('getRawFullTranscript', () => {
    it('returns null when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(getRawFullTranscript('loop-123')).toBeNull();
    });

    it('returns raw content when file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const rawContent = '{"line": 1}\n{"line": 2}';
      vi.mocked(fs.readFileSync).mockReturnValue(rawContent);

      expect(getRawFullTranscript('loop-123')).toBe(rawContent);
    });

    it('returns null on read error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      expect(getRawFullTranscript('loop-123')).toBeNull();
    });
  });
});
