import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ChecklistResponse, ErrorResponse } from '../../server/types';
import { subscribeToChecklist } from '../lib/websocket';

const API_BASE = '/api';

export interface ChecklistError {
  error: string;
  message: string;
}

/**
 * React Query hook for fetching checklist data with real-time WebSocket updates
 * @param loopId - The loop ID to fetch checklist for
 * @param enabled - Whether to enable the query (default: true)
 * @param isActive - Whether the session is active (enables WebSocket subscription)
 */
export function useChecklist(
  loopId: string | undefined,
  enabled: boolean = true,
  isActive: boolean = false
) {
  const queryClient = useQueryClient();

  // HTTP fetch for initial data
  const query = useQuery<ChecklistResponse, ChecklistError>({
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
    enabled: enabled && !!loopId,
    staleTime: isActive ? 2000 : 30000, // Shorter stale time for active sessions
    refetchInterval: isActive ? false : 30000, // Disable polling for active (use WebSocket)
  });

  // WebSocket subscription for real-time updates (active sessions only)
  useEffect(() => {
    if (!enabled || !isActive || !loopId) return;

    const unsubscribe = subscribeToChecklist(loopId, (data) => {
      // Update React Query cache with WebSocket data
      queryClient.setQueryData<ChecklistResponse>(['checklist', loopId], {
        checklist: data.checklist,
        progress: data.progress,
      });
    });

    return unsubscribe;
  }, [loopId, enabled, isActive, queryClient]);

  return query;
}
