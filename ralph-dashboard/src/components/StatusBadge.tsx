import type { Session } from '../../server/types';

interface StatusBadgeProps {
  status: Session['status'];
}

/**
 * Shared status badge component for displaying session status
 * Used across SessionCard, SessionDetail, and SessionRow
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <span
            className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
            aria-hidden="true"
          />
          Active
        </span>
      );
    case 'success':
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
          ✓ Success
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
          ⏹ Cancelled
        </span>
      );
    case 'max_iterations':
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
          ⚠ Max Iterations
        </span>
      );
    case 'error':
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          ✗ Error
        </span>
      );
    case 'abandoned':
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
          ⏹ Abandoned
        </span>
      );
    case 'orphaned':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          <span
            className="w-2 h-2 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          Orphaned
        </span>
      );
    case 'archived':
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          Archived
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          Unknown
        </span>
      );
  }
}
