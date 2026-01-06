import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGetChecklist } from '../api/checklist';
import * as checklistService from '../services/checklist-service';
import type { Checklist } from '../types';

// Mock the checklist service
vi.mock('../services/checklist-service');

const mockGetChecklistWithProgress = vi.mocked(
  checklistService.getChecklistWithProgress
);

describe('handleGetChecklist', () => {
  const validChecklist: Checklist = {
    loop_id: 'test-loop-123',
    session_id: 'session-abc',
    project: '/path/to/project',
    project_name: 'test-project',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    completion_criteria: [
      {
        id: 'criteria-1',
        text: 'First criteria',
        status: 'completed',
        created_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:30:00Z',
        completed_iteration: 5,
      },
      {
        id: 'criteria-2',
        text: 'Second criteria',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        completed_iteration: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful requests', () => {
    it('returns checklist with progress for valid loop_id', async () => {
      mockGetChecklistWithProgress.mockReturnValue({
        checklist: validChecklist,
        progress: {
          criteria: '1/2 criteria',
          criteriaCompleted: 1,
          criteriaTotal: 2,
        },
      });

      const response = handleGetChecklist('valid-loop-123');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        checklist: validChecklist,
        progress: {
          criteria: '1/2 criteria',
          criteriaCompleted: 1,
          criteriaTotal: 2,
        },
      });
      expect(mockGetChecklistWithProgress).toHaveBeenCalledWith(
        'valid-loop-123'
      );
    });

    it('returns checklist with all completed items', async () => {
      const completedChecklist: Checklist = {
        ...validChecklist,
        completion_criteria: validChecklist.completion_criteria.map((item) => ({
          ...item,
          status: 'completed' as const,
          completed_at: '2024-01-15T10:30:00Z',
          completed_iteration: 10,
        })),
      };

      mockGetChecklistWithProgress.mockReturnValue({
        checklist: completedChecklist,
        progress: {
          criteria: '2/2 criteria',
          criteriaCompleted: 2,
          criteriaTotal: 2,
        },
      });

      const response = handleGetChecklist('completed-loop');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(
        data.checklist.completion_criteria.every(
          (c: { status: string }) => c.status === 'completed'
        )
      ).toBe(true);
    });

    it('returns checklist with empty arrays', async () => {
      const emptyChecklist: Checklist = {
        ...validChecklist,
        completion_criteria: [],
      };

      mockGetChecklistWithProgress.mockReturnValue({
        checklist: emptyChecklist,
        progress: {
          criteria: '0/0 criteria',
          criteriaCompleted: 0,
          criteriaTotal: 0,
        },
      });

      const response = handleGetChecklist('empty-loop');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checklist.completion_criteria).toEqual([]);
    });

    it('returns checklist with pending items only', async () => {
      const pendingChecklist: Checklist = {
        ...validChecklist,
        completion_criteria: validChecklist.completion_criteria.map((item) => ({
          ...item,
          status: 'pending' as const,
          completed_at: null,
          completed_iteration: null,
        })),
      };

      mockGetChecklistWithProgress.mockReturnValue({
        checklist: pendingChecklist,
        progress: {
          criteria: '0/2 criteria',
          criteriaCompleted: 0,
          criteriaTotal: 2,
        },
      });

      const response = handleGetChecklist('pending-loop');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.criteriaCompleted).toBe(0);
    });
  });

  describe('404 NOT_FOUND responses', () => {
    it('returns 404 when checklist not found', async () => {
      mockGetChecklistWithProgress.mockReturnValue({
        checklist: null,
        progress: null,
      });

      const response = handleGetChecklist('non-existent-loop');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'NOT_FOUND',
        message: 'Checklist not found for loop_id: non-existent-loop',
      });
    });

    it('returns 404 with null checklist result', async () => {
      mockGetChecklistWithProgress.mockReturnValue({
        checklist: null,
        progress: null,
      });

      const response = handleGetChecklist('missing-loop');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('400 INVALID_LOOP_ID responses', () => {
    it('returns 400 for invalid loop_id with path traversal', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw new Error('Invalid loop_id format: ../etc/passwd');
      });

      const response = handleGetChecklist('../etc/passwd');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'INVALID_LOOP_ID',
        message: 'Invalid loop_id format: ../etc/passwd',
      });
    });

    it('returns 400 for invalid loop_id with special characters', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw new Error('Invalid loop_id format: loop@id#123');
      });

      const response = handleGetChecklist('loop@id#123');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_LOOP_ID');
    });

    it('returns 400 for empty loop_id', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw new Error('Invalid loop_id format: ');
      });

      const response = handleGetChecklist('');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_LOOP_ID');
    });

    it('returns 400 for loop_id exceeding max length', async () => {
      const longId = 'a'.repeat(257);
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw new Error(`Invalid loop_id format: ${longId}`);
      });

      const response = handleGetChecklist(longId);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_LOOP_ID');
    });
  });

  describe('500 FETCH_ERROR responses', () => {
    it('returns 500 for generic service errors', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw new Error('File system error');
      });

      const response = handleGetChecklist('valid-loop-123');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'FETCH_ERROR',
        message: 'Failed to fetch checklist: File system error',
      });
    });

    it('returns 500 for non-Error thrown objects', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw 'String error';
      });

      const response = handleGetChecklist('valid-loop-123');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'FETCH_ERROR',
        message: 'Failed to fetch checklist: String error',
      });
    });

    it('returns 500 for object thrown errors', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw { code: 'CUSTOM_ERROR', message: 'Custom error message' };
      });

      const response = handleGetChecklist('valid-loop-123');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'FETCH_ERROR',
        message: 'Failed to fetch checklist: [object Object]',
      });
    });

    it('returns 500 for null thrown errors', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw null;
      });

      const response = handleGetChecklist('valid-loop-123');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'FETCH_ERROR',
        message: 'Failed to fetch checklist: null',
      });
    });

    it('returns 500 for undefined thrown errors', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw undefined;
      });

      const response = handleGetChecklist('valid-loop-123');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'FETCH_ERROR',
        message: 'Failed to fetch checklist: undefined',
      });
    });

    it('returns 500 for permission errors', async () => {
      mockGetChecklistWithProgress.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const response = handleGetChecklist('valid-loop-123');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('FETCH_ERROR');
      expect(data.message).toContain('permission denied');
    });
  });

  describe('edge cases', () => {
    it('handles loop_id with dots and dashes', async () => {
      mockGetChecklistWithProgress.mockReturnValue({
        checklist: validChecklist,
        progress: {
          criteria: '1/2 criteria',
          criteriaCompleted: 1,
          criteriaTotal: 2,
        },
      });

      const response = handleGetChecklist('loop-123.456_test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checklist).toEqual(validChecklist);
    });

    it('handles loop_id with underscores', async () => {
      mockGetChecklistWithProgress.mockReturnValue({
        checklist: validChecklist,
        progress: {
          criteria: '1/2 criteria',
          criteriaCompleted: 1,
          criteriaTotal: 2,
        },
      });

      const response = handleGetChecklist('loop_123_test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checklist).toEqual(validChecklist);
    });

    it('handles loop_id with maximum valid length', async () => {
      const maxId = 'a'.repeat(256);
      mockGetChecklistWithProgress.mockReturnValue({
        checklist: validChecklist,
        progress: {
          criteria: '1/2 criteria',
          criteriaCompleted: 1,
          criteriaTotal: 2,
        },
      });

      const response = handleGetChecklist(maxId);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checklist).toEqual(validChecklist);
    });
  });
});
