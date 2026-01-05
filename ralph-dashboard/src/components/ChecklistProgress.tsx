import { useChecklist } from '../hooks/useChecklist';
import type { ChecklistItemStatus } from '../../server/types';
import { useMemo } from 'react';

interface ChecklistProgressProps {
  loopId: string;
}

const statusConfig: Record<
  ChecklistItemStatus,
  { label: string; bgColor: string; textColor: string; borderColor: string }
> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
  },
};

function getStatusBadge(status: ChecklistItemStatus) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.label}
    </span>
  );
}

function ChecklistItemRow({
  item,
}: {
  item: {
    id: string;
    text: string;
    status: ChecklistItemStatus;
    completed_iteration?: number | null;
  };
}) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-gray-50 rounded transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        {item.status === 'completed' ? (
          <svg
            className="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ) : item.status === 'in_progress' ? (
          <svg
            className="w-5 h-5 text-blue-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            item.status === 'completed'
              ? 'text-gray-500 line-through'
              : 'text-gray-900'
          }`}
        >
          {item.text}
        </p>
        {item.completed_iteration && (
          <p className="text-xs text-gray-500 mt-0.5">
            Completed in iteration {item.completed_iteration}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{getStatusBadge(item.status)}</div>
    </div>
  );
}

export function ChecklistProgress({ loopId }: ChecklistProgressProps) {
  const { data, isLoading, error, isError } = useChecklist(loopId);

  const { progressSummary, tasksCount, criteriaCount } = useMemo(() => {
    if (!data?.checklist) {
      return { progressSummary: '', tasksCount: 0, criteriaCount: 0 };
    }

    const tasksCompleted = data.checklist.task_checklist.filter(
      (item) => item.status === 'completed'
    ).length;
    const tasksTotal = data.checklist.task_checklist.length;
    const criteriaCompleted = data.checklist.completion_criteria.filter(
      (item) => item.status === 'completed'
    ).length;
    const criteriaTotal = data.checklist.completion_criteria.length;

    return {
      progressSummary: `${tasksCompleted}/${tasksTotal} tasks • ${criteriaCompleted}/${criteriaTotal} criteria`,
      tasksCount: tasksTotal,
      criteriaCount: criteriaTotal,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-claude-coral"></div>
          <span className="ml-2 text-sm text-gray-600">
            Loading checklist...
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-red-600">
          Failed to load checklist: {error?.message}
        </p>
      </div>
    );
  }

  if (!data?.checklist) {
    return null;
  }

  const hasItems = tasksCount > 0 || criteriaCount > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with summary */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-claude-coral"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Checklist Progress
          </h3>
          {hasItems && (
            <span className="text-sm font-medium text-claude-coral">
              {progressSummary}
            </span>
          )}
        </div>
      </div>

      {/* Checklist items */}
      {hasItems ? (
        <div className="divide-y divide-gray-100">
          {/* Tasks section */}
          {tasksCount > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Tasks
              </div>
              <div className="divide-y divide-gray-100">
                {data.checklist.task_checklist.map((item) => (
                  <ChecklistItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Completion criteria section */}
          {criteriaCount > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide border-t border-gray-200">
                Completion Criteria
              </div>
              <div className="divide-y divide-gray-100">
                {data.checklist.completion_criteria.map((item) => (
                  <ChecklistItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-gray-500 italic">
          No checklist items yet
        </div>
      )}
    </div>
  );
}
