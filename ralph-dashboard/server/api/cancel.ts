import { getSessionById } from '../services/log-parser';
import { cancelLoop } from '../services/loop-manager';
import type { CancelResponse, ErrorResponse } from '../types';

export function handleCancelSession(loopId: string): Response {
  try {
    const session = getSessionById(loopId);

    if (!session) {
      const response: ErrorResponse = {
        error: 'NOT_FOUND',
        message: `Loop not found: ${loopId}`,
      };
      return Response.json(response, { status: 404 });
    }

    if (session.status !== 'active') {
      const response: ErrorResponse = {
        error: 'INVALID_STATE',
        message: `Cannot cancel loop: status is '${session.status}', expected 'active'`,
      };
      return Response.json(response, { status: 400 });
    }

    const result = cancelLoop(session);

    if (!result.success) {
      const response: ErrorResponse = {
        error: 'CANCEL_FAILED',
        message: result.message,
      };
      return Response.json(response, { status: 500 });
    }

    const response: CancelResponse = {
      success: true,
      message: result.message,
      loop_id: loopId,
    };

    return Response.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const response: ErrorResponse = {
      error: 'CANCEL_ERROR',
      message: `Failed to cancel loop: ${errorMessage}`,
    };
    return Response.json(response, { status: 500 });
  }
}
