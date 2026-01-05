import {
  getIterations,
  getFullTranscript,
  hasIterations,
  hasFullTranscript,
} from '../services/transcript-service';
import type {
  ErrorResponse,
  IterationsResponse,
  FullTranscriptResponse,
} from '../types';

export function handleGetIterations(loopId: string): Response {
  try {
    const iterations = getIterations(loopId);

    if (iterations === null) {
      const response: ErrorResponse = {
        error: 'NOT_FOUND',
        message: `No transcript iterations found for loop: ${loopId}`,
      };
      return Response.json(response, { status: 404 });
    }

    const response: IterationsResponse = { iterations };
    return Response.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const response: ErrorResponse = {
      error: 'FETCH_ERROR',
      message: `Failed to fetch iterations: ${errorMessage}`,
    };
    return Response.json(response, { status: 500 });
  }
}

export function handleGetFullTranscript(loopId: string): Response {
  try {
    const messages = getFullTranscript(loopId);

    if (messages === null) {
      const response: ErrorResponse = {
        error: 'NOT_FOUND',
        message: `No full transcript found for loop: ${loopId}`,
      };
      return Response.json(response, { status: 404 });
    }

    const response: FullTranscriptResponse = { messages };
    return Response.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const response: ErrorResponse = {
      error: 'FETCH_ERROR',
      message: `Failed to fetch full transcript: ${errorMessage}`,
    };
    return Response.json(response, { status: 500 });
  }
}

export function handleCheckTranscriptAvailability(loopId: string): Response {
  try {
    const response = {
      hasIterations: hasIterations(loopId),
      hasFullTranscript: hasFullTranscript(loopId),
    };
    return Response.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const response: ErrorResponse = {
      error: 'CHECK_ERROR',
      message: `Failed to check transcript availability: ${errorMessage}`,
    };
    return Response.json(response, { status: 500 });
  }
}
