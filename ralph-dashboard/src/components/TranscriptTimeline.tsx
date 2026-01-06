import { useState, useMemo } from 'react';
import type { Session, IterationEntry } from '../../server/types';
import { useTranscriptIterations } from '../hooks/useTranscript';
import { FullTranscriptModal } from './FullTranscriptModal';
import { ErrorBoundary } from './ErrorBoundary';
import {
  exportTranscriptAsMarkdown,
  downloadMarkdown,
  generateExportFilename,
} from '../utils/exportTranscript';

interface TranscriptTimelineProps {
  session: Session;
}

/**
 * Calculate duration between two timestamps in human-readable format.
 */
function formatIterationDuration(
  currentTimestamp: string,
  nextTimestamp: string | null
): string {
  if (!nextTimestamp) return '';

  const start = new Date(currentTimestamp).getTime();
  const end = new Date(nextTimestamp).getTime();
  const diffSeconds = Math.round((end - start) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s`;
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  if (minutes < 60)
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Truncate text and add ellipsis if too long.
 */
function truncateText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Highlight search term in text.
 */
function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function TranscriptTimeline({ session }: TranscriptTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
  const [expandedIterations, setExpandedIterations] = useState<Set<number>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  // Check if session is active (needs real-time updates via WebSocket)
  const isActive = session.status === 'active' || session.status === 'orphaned';

  // Fetch iterations only when expanded, with WebSocket for active sessions
  const { data, isLoading, error } = useTranscriptIterations(
    session.loop_id,
    isExpanded,
    isActive
  );

  const iterations = data?.iterations ?? [];

  // Calculate durations between iterations
  const iterationsWithDuration = useMemo(() => {
    return iterations.map((iter, index) => {
      const nextTimestamp =
        index < iterations.length - 1
          ? iterations[index + 1].timestamp
          : session.ended_at;
      return {
        ...iter,
        duration: formatIterationDuration(iter.timestamp, nextTimestamp),
      };
    });
  }, [iterations, session.ended_at]);

  // Filter iterations by search term
  const filteredIterations = useMemo(() => {
    if (!searchTerm.trim()) return iterationsWithDuration;
    const lowerSearch = searchTerm.toLowerCase();
    return iterationsWithDuration.filter((iter) =>
      iter.output.toLowerCase().includes(lowerSearch)
    );
  }, [iterationsWithDuration, searchTerm]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleIterationExpand = (iterationNum: number) => {
    setExpandedIterations((prev) => {
      const next = new Set(prev);
      if (next.has(iterationNum)) {
        next.delete(iterationNum);
      } else {
        next.add(iterationNum);
      }
      return next;
    });
  };

  const handleExport = () => {
    const markdown = exportTranscriptAsMarkdown(session, iterations);
    const filename = generateExportFilename(session);
    downloadMarkdown(markdown, filename);
  };

  const iterationCount = iterations.length;
  const headerLabel =
    iterationCount > 0
      ? `Transcript (${iterationCount} iteration${iterationCount !== 1 ? 's' : ''})`
      : 'Transcript';

  return (
    <div className="bg-white dark:bg-claude-dark rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
      {/* Header with summary */}
      <div
        onClick={toggleExpand}
        className="px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <span
              className={`transform transition-transform duration-200 text-gray-400 dark:text-zinc-500 ${
                isExpanded ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            >
              ▶
            </span>
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
            {headerLabel}
          </h3>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500 dark:text-zinc-400">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
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
                <span className="text-sm">Loading transcript...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500 dark:text-zinc-400">
                <span className="text-4xl mb-2 block">📭</span>
                <p className="text-sm">
                  No transcript available (recorded from v2.1.0+)
                </p>
              </div>
            </div>
          )}

          {/* Timeline Content - always shown when not loading/error */}
          {!isLoading && !error && (
            <div className="bg-gray-300 dark:bg-zinc-900 py-4">
              {/* Toolbar - only shown when there are iterations */}
              {iterations.length > 0 && (
                <div className="p-3 mx-4 mb-4 bg-white dark:bg-zinc-800 rounded-lg">
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                      <input
                        type="text"
                        placeholder="Search iterations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-claude-coral/50 focus:border-claude-coral dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                        aria-label="Search iterations"
                      />
                      <svg
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                          aria-label="Clear search"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFullTranscript(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-zinc-400 hover:text-claude-coral dark:hover:text-claude-coral-dark hover:bg-white dark:hover:bg-zinc-900 rounded-lg transition-colors"
                        title="View full transcript"
                      >
                        <span>📜</span>
                        <span className="hidden sm:inline">View Full</span>
                      </button>
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-zinc-400 hover:text-claude-coral dark:hover:text-claude-coral-dark hover:bg-white dark:hover:bg-zinc-900 rounded-lg transition-colors"
                        title="Export as Markdown"
                      >
                        <span>📥</span>
                        <span className="hidden sm:inline">Export</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Results Count - only shown when there are iterations */}
              {iterations.length > 0 && searchTerm && (
                <div className="px-4 pb-2 text-xs text-gray-500 dark:text-zinc-500">
                  Found {filteredIterations.length} of {iterations.length}{' '}
                  iteration{iterations.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* User Prompt */}
              <div className="p-4 mx-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium text-sm mb-2">
                  <span>📝</span>
                  <span>USER PROMPT</span>
                </div>
                <p className="text-gray-700 dark:text-zinc-100 text-sm whitespace-pre-wrap break-words">
                  {session.task || 'No task description'}
                </p>
              </div>

              {/* Arrow from prompt to iterations */}
              {filteredIterations.length > 0 && (
                <div className="flex justify-center py-2">
                  <svg
                    className="w-6 h-6 text-gray-600 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              )}

              {/* Iterations */}
              {filteredIterations.map((iteration, index) => (
                <div key={iteration.iteration} className="px-4">
                  <IterationCard
                    iteration={iteration}
                    isExpanded={expandedIterations.has(iteration.iteration)}
                    onToggleExpand={() =>
                      toggleIterationExpand(iteration.iteration)
                    }
                    searchTerm={searchTerm}
                  />
                  {/* Down arrow between iterations */}
                  {index < filteredIterations.length - 1 && (
                    <div className="flex justify-center py-2">
                      <svg
                        className="w-6 h-6 text-gray-600 dark:text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {/* Arrow to completion status */}
              <div className="flex justify-center py-2">
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>

              {/* Completion Status */}
              <div className="px-4">
                <CompletionStatus session={session} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Full Transcript Modal */}
      <ErrorBoundary>
        <FullTranscriptModal
          loopId={session.loop_id}
          isOpen={showFullTranscript}
          onClose={() => setShowFullTranscript(false)}
        />
      </ErrorBoundary>
    </div>
  );
}

interface IterationCardProps {
  iteration: IterationEntry & { duration: string };
  isExpanded: boolean;
  onToggleExpand: () => void;
  searchTerm?: string;
}

function IterationCard({
  iteration,
  isExpanded,
  onToggleExpand,
  searchTerm = '',
}: IterationCardProps) {
  const needsTruncation = iteration.output.length > 300;
  const displayText = isExpanded
    ? iteration.output
    : truncateText(iteration.output, 300);

  return (
    <div className="bg-white dark:bg-claude-dark border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-100 font-medium text-sm">
          <span>🔄</span>
          <span>Iteration {iteration.iteration}</span>
        </div>
        {iteration.duration && (
          <span className="bg-claude-coral/10 dark:bg-claude-coral/20 text-claude-coral text-xs font-medium px-2 py-0.5 rounded-full">
            {iteration.duration}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-gray-600 dark:text-zinc-300 text-sm whitespace-pre-wrap break-words">
          {highlightText(displayText, searchTerm)}
        </p>
        {needsTruncation && (
          <button
            onClick={onToggleExpand}
            className="mt-2 text-xs text-claude-coral hover:text-claude-coral-dark font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  );
}

interface CompletionStatusProps {
  session: Session;
}

function CompletionStatus({ session }: CompletionStatusProps) {
  const isActive = session.status === 'active';
  const isSuccess = session.status === 'success';
  const isMaxIterations = session.status === 'max_iterations';
  const isCancelled = session.status === 'cancelled';
  const isError = session.status === 'error';
  const isOrphaned = session.status === 'orphaned';

  // Calculate total duration
  const formatTotalDuration = (): string => {
    const seconds = session.duration_seconds;
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s total`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60)
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s total`
        : `${minutes}m total`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m total`
      : `${hours}h total`;
  };

  if (isActive) {
    return (
      <div className="border-2 border-dashed border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm">
          <span>⏳</span>
          <span>IN PROGRESS...</span>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-700 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
            <span>✅</span>
            <span>COMPLETED</span>
          </div>
          {session.duration_seconds && (
            <span className="text-green-600 dark:text-green-400 text-xs font-medium">
              {formatTotalDuration()}
            </span>
          )}
        </div>
        {session.completion_promise && (
          <p className="text-green-600 dark:text-green-400 text-sm">
            Promise fulfilled:{' '}
            <code className="bg-green-100 dark:bg-green-900/50 px-1 rounded">
              &lt;promise&gt;{session.completion_promise}&lt;/promise&gt;
            </code>
          </p>
        )}
      </div>
    );
  }

  if (isMaxIterations) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-700 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium text-sm">
            <span>🔁</span>
            <span>MAX ITERATIONS REACHED</span>
          </div>
          {session.duration_seconds && (
            <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">
              {formatTotalDuration()}
            </span>
          )}
        </div>
        <p className="text-orange-600 dark:text-orange-400 text-sm">
          Loop stopped after {session.iterations} iterations (max:{' '}
          {session.max_iterations})
        </p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm">
            <span>⏹</span>
            <span>CANCELLED</span>
          </div>
          {session.duration_seconds && (
            <span className="text-red-600 dark:text-red-400 text-xs font-medium">
              {formatTotalDuration()}
            </span>
          )}
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">
          Loop was cancelled by user after {session.iterations} iterations
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm">
            <span>❌</span>
            <span>ERROR</span>
          </div>
          {session.duration_seconds && (
            <span className="text-red-600 dark:text-red-400 text-xs font-medium">
              {formatTotalDuration()}
            </span>
          )}
        </div>
        {session.error_reason && (
          <p className="text-red-600 dark:text-red-400 text-sm">
            {session.error_reason}
          </p>
        )}
      </div>
    );
  }

  if (isOrphaned) {
    return (
      <div className="bg-gray-100 dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-100 font-medium text-sm">
          <span>👻</span>
          <span>ORPHANED</span>
        </div>
        <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">
          Session became orphaned (terminal closed or state file missing)
        </p>
      </div>
    );
  }

  return null;
}
