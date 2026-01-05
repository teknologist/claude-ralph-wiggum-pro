import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleGetIterations,
  handleGetFullTranscript,
  handleCheckTranscriptAvailability,
} from '../api/transcript';
import * as transcriptService from '../services/transcript-service';

vi.mock('../services/transcript-service');

describe('handleGetIterations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns iterations when found', async () => {
    const mockIterations = [
      { iteration: 1, timestamp: '2024-01-15T10:00:00Z', output: 'First' },
      { iteration: 2, timestamp: '2024-01-15T10:30:00Z', output: 'Second' },
    ];
    vi.mocked(transcriptService.getIterations).mockReturnValue(mockIterations);

    const response = handleGetIterations('loop-123');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ iterations: mockIterations });
    expect(transcriptService.getIterations).toHaveBeenCalledWith('loop-123');
  });

  it('returns 404 when iterations not found', async () => {
    vi.mocked(transcriptService.getIterations).mockReturnValue(null);

    const response = handleGetIterations('loop-123');
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toContain('loop-123');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(transcriptService.getIterations).mockImplementation(() => {
      throw new Error('Read error');
    });

    const response = handleGetIterations('loop-123');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('FETCH_ERROR');
    expect(data.message).toContain('Read error');
  });

  it('handles non-Error thrown objects', async () => {
    vi.mocked(transcriptService.getIterations).mockImplementation(() => {
      throw 'string error';
    });

    const response = handleGetIterations('loop-123');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('FETCH_ERROR');
    expect(data.message).toContain('string error');
  });
});

describe('handleGetFullTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns messages when found', async () => {
    const mockMessages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
    ];
    vi.mocked(transcriptService.getFullTranscript).mockReturnValue(
      mockMessages
    );

    const response = handleGetFullTranscript('loop-123');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ messages: mockMessages });
    expect(transcriptService.getFullTranscript).toHaveBeenCalledWith(
      'loop-123'
    );
  });

  it('returns 404 when transcript not found', async () => {
    vi.mocked(transcriptService.getFullTranscript).mockReturnValue(null);

    const response = handleGetFullTranscript('loop-123');
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toContain('loop-123');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(transcriptService.getFullTranscript).mockImplementation(() => {
      throw new Error('Parse error');
    });

    const response = handleGetFullTranscript('loop-123');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('FETCH_ERROR');
    expect(data.message).toContain('Parse error');
  });

  it('handles non-Error thrown objects', async () => {
    vi.mocked(transcriptService.getFullTranscript).mockImplementation(() => {
      throw { code: 'CUSTOM' };
    });

    const response = handleGetFullTranscript('loop-123');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('FETCH_ERROR');
  });
});

describe('handleCheckTranscriptAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns availability status for both files', async () => {
    vi.mocked(transcriptService.hasIterations).mockReturnValue(true);
    vi.mocked(transcriptService.hasFullTranscript).mockReturnValue(true);

    const response = handleCheckTranscriptAvailability('loop-123');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      hasIterations: true,
      hasFullTranscript: true,
    });
    expect(transcriptService.hasIterations).toHaveBeenCalledWith('loop-123');
    expect(transcriptService.hasFullTranscript).toHaveBeenCalledWith(
      'loop-123'
    );
  });

  it('returns false when files do not exist', async () => {
    vi.mocked(transcriptService.hasIterations).mockReturnValue(false);
    vi.mocked(transcriptService.hasFullTranscript).mockReturnValue(false);

    const response = handleCheckTranscriptAvailability('loop-123');
    const data = await response.json();

    expect(data).toEqual({
      hasIterations: false,
      hasFullTranscript: false,
    });
  });

  it('returns mixed availability status', async () => {
    vi.mocked(transcriptService.hasIterations).mockReturnValue(true);
    vi.mocked(transcriptService.hasFullTranscript).mockReturnValue(false);

    const response = handleCheckTranscriptAvailability('loop-123');
    const data = await response.json();

    expect(data).toEqual({
      hasIterations: true,
      hasFullTranscript: false,
    });
  });

  it('handles errors gracefully', async () => {
    vi.mocked(transcriptService.hasIterations).mockImplementation(() => {
      throw new Error('File system error');
    });

    const response = handleCheckTranscriptAvailability('loop-123');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('CHECK_ERROR');
    expect(data.message).toContain('File system error');
  });

  it('handles non-Error thrown objects', async () => {
    vi.mocked(transcriptService.hasIterations).mockImplementation(() => {
      throw 'unexpected error';
    });

    const response = handleCheckTranscriptAvailability('loop-123');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('CHECK_ERROR');
    expect(data.message).toContain('unexpected error');
  });
});
