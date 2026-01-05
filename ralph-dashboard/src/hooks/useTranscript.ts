import { useQuery } from '@tanstack/react-query';
import {
  fetchTranscriptIterations,
  fetchFullTranscript,
  checkTranscriptAvailability,
} from '../lib/api';

/**
 * Hook to fetch transcript iterations for a loop.
 * Only fetches when enabled is true (for lazy loading on expand).
 */
export function useTranscriptIterations(loopId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['transcript', 'iterations', loopId],
    queryFn: () => fetchTranscriptIterations(loopId),
    enabled,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 1, // Only retry once on failure
  });
}

/**
 * Hook to fetch full transcript for a loop.
 * Only fetches when enabled is true (for lazy loading).
 */
export function useFullTranscript(loopId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['transcript', 'full', loopId],
    queryFn: () => fetchFullTranscript(loopId),
    enabled,
    staleTime: 60000, // Consider data fresh for 60 seconds
    retry: 1,
  });
}

/**
 * Hook to check transcript availability for a loop.
 */
export function useTranscriptAvailability(loopId: string) {
  return useQuery({
    queryKey: ['transcript', 'availability', loopId],
    queryFn: () => checkTranscriptAvailability(loopId),
    staleTime: 30000,
    retry: 1,
  });
}
