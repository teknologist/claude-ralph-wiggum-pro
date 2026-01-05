import {
  getChecklistWithProgress,
  hasChecklist,
} from '../services/checklist-service.js';
import type { ChecklistResponse, ErrorResponse } from '../types.js';

/**
 * Handle GET /api/checklist/:loopId - Get checklist for a loop
 */
export function handleGetChecklist(loopId: string): Response {
  try {
    const result = getChecklistWithProgress(loopId);

    if (!result.checklist) {
      const response: ErrorResponse = {
        error: 'NOT_FOUND',
        message: `Checklist not found for loop_id: ${loopId}`,
      };
      return Response.json(response, { status: 404 });
    }

    const response: ChecklistResponse = {
      checklist: result.checklist,
      progress: result.progress,
    };

    return Response.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Invalid loop_id')) {
      const response: ErrorResponse = {
        error: 'INVALID_LOOP_ID',
        message: errorMessage,
      };
      return Response.json(response, { status: 400 });
    }

    const response: ErrorResponse = {
      error: 'FETCH_ERROR',
      message: `Failed to fetch checklist: ${errorMessage}`,
    };
    return Response.json(response, { status: 500 });
  }
}

/**
 * Check if a checklist exists for a loop (used by other services)
 */
export { hasChecklist };
