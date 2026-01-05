import { appendFileSync } from 'fs';
import { getSessionById, getLogFilePath } from '../services/log-parser';
import type { ErrorResponse } from '../types';

interface ArchiveResponse {
  success: boolean;
  message: string;
  loop_id: string;
}

export function handleArchiveSession(loopId: string): Response {
  try {
    const session = getSessionById(loopId);

    if (!session) {
      const response: ErrorResponse = {
        error: 'NOT_FOUND',
        message: `Loop not found: ${loopId}`,
      };
      return Response.json(response, { status: 404 });
    }

    if (session.status !== 'orphaned') {
      const response: ErrorResponse = {
        error: 'INVALID_STATE',
        message: `Cannot archive loop: status is '${session.status}', expected 'orphaned'`,
      };
      return Response.json(response, { status: 400 });
    }

    // Write completion entry to mark the orphaned session as archived
    const logEntry = {
      loop_id: session.loop_id,
      session_id: session.session_id,
      status: 'completed',
      outcome: 'orphaned',
      ended_at: new Date().toISOString(),
      duration_seconds: Math.floor(
        (Date.now() - new Date(session.started_at).getTime()) / 1000
      ),
      iterations: session.iterations ?? null,
    };
    appendFileSync(getLogFilePath(), JSON.stringify(logEntry) + '\n');

    const response: ArchiveResponse = {
      success: true,
      message: `Successfully archived orphaned loop ${loopId}`,
      loop_id: loopId,
    };

    return Response.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const response: ErrorResponse = {
      error: 'ARCHIVE_ERROR',
      message: `Failed to archive loop: ${errorMessage}`,
    };
    return Response.json(response, { status: 500 });
  }
}
