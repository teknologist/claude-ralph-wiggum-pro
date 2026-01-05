import { useQuery } from '@tanstack/react-query';
import type { ChecklistResponse, ErrorResponse } from '../../server/types';

const API_BASE = '/api';

export interface ChecklistError {
  error: string;
  message: string;
}

/**
 * React Query hook for fetching checklist data
 */
export function useChecklist(loopId: string | undefined) {
  return useQuery<ChecklistResponse, ChecklistError>({
    queryKey: ['checklist', loopId],
    queryFn: async () => {
      if (!loopId) {
        throw new Error('loopId is required');
      }

      const response = await fetch(`${API_BASE}/checklist/${loopId}`);

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        throw {
          error: errorData.error || 'FETCH_ERROR',
          message: errorData.message || 'Failed to fetch checklist',
        } as ChecklistError;
      }

      return response.json() as Promise<ChecklistResponse>;
    },
    enabled: !!loopId,
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchInterval: 5000, // Auto-refetch every 5 seconds for active sessions
  });
}
