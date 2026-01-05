import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveSession } from '../lib/api';

export function useArchiveLoop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveSession,
    onSuccess: () => {
      // Invalidate sessions query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
