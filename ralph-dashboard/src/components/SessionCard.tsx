import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { Session } from '../../server/types';
import { SessionDetail } from './SessionDetail';
import { ConfirmModal } from './ConfirmModal';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { useCancelLoop } from '../hooks/useCancelLoop';
import { useDeleteSession } from '../hooks/useDeleteSession';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { BREAKPOINTS, SWIPE_CONFIG } from '../constants/breakpoints';

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const cancelMutation = useCancelLoop();
  const deleteMutation = useDeleteSession();

  // Only enable swipe on actual mobile devices
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);

  // Determine which actions are available based on session status
  const canCancel = session.status === 'active';
  const canDelete = session.status !== 'active';

  // Cleanup on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      setSwipeOffset(0);
    };
  }, []);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const resetSwipe = () => {
    setSwipeOffset(0);
  };

  // Keyboard handler for accessibility
  const handleKeyDown = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Swipe handlers for mobile actions
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const { absX, dir } = eventData;
      if (dir === 'Left' && canCancel) {
        setSwipeOffset(Math.max(-absX, -SWIPE_CONFIG.BUTTON_WIDTH));
      } else if (dir === 'Right' && canDelete) {
        setSwipeOffset(Math.min(absX, SWIPE_CONFIG.BUTTON_WIDTH));
      } else {
        setSwipeOffset(0);
      }
    },
    onSwiped: (eventData) => {
      const { absX, dir } = eventData;
      if (dir === 'Left' && canCancel) {
        setSwipeOffset(
          absX > SWIPE_CONFIG.THRESHOLD ? -SWIPE_CONFIG.BUTTON_WIDTH : 0
        );
        if (absX > SWIPE_CONFIG.THRESHOLD) {
          handleCancel();
        }
      } else if (dir === 'Right' && canDelete) {
        setSwipeOffset(
          absX > SWIPE_CONFIG.THRESHOLD ? SWIPE_CONFIG.BUTTON_WIDTH : 0
        );
        if (absX > SWIPE_CONFIG.THRESHOLD) {
          handleDelete();
        }
      } else {
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  // Only apply swipe handlers on mobile devices
  const swipeHandlers = isMobile ? handlers : {};

  const formatDuration = (seconds: number | undefined): string => {
    if (seconds === undefined) return 'Active';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const truncateTask = (task: string | undefined, maxLength: number = 80) => {
    if (!task) return 'No task description';
    if (task.length <= maxLength) return task;
    return task.slice(0, maxLength) + '...';
  };

  const confirmCancel = () => {
    cancelMutation.mutate(session.loop_id, {
      onSuccess: () => {
        setShowCancelModal(false);
        setIsExpanded(false);
        resetSwipe();
      },
      onError: (error) => {
        alert(`Failed to cancel: ${error.message}`);
        resetSwipe();
      },
    });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(session.loop_id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setIsExpanded(false);
        resetSwipe();
      },
      onError: (error) => {
        alert(`Failed to delete: ${error.message}`);
        resetSwipe();
      },
    });
  };

  return (
    <>
      <div
        data-testid="session-card"
        className="relative rounded-lg shadow-md overflow-hidden"
      >
        {/* Swipe Actions Container - mobile only */}
        {isMobile && (
          <div className="absolute inset-y-0 left-0 right-0 flex pointer-events-none">
            {/* Delete Action (swipe right reveals from left) - Only for archived sessions */}
            {session.status !== 'active' && (
              <button
                onClick={handleDelete}
                onKeyDown={handleKeyDown(handleDelete)}
                aria-label="Delete this session permanently"
                className="pointer-events-auto h-full bg-red-600 text-white px-4 flex items-center justify-center transition-transform ease-out"
                style={{
                  transform: `translateX(${Math.min(swipeOffset, 0)}px)`,
                  minWidth: `${SWIPE_CONFIG.BUTTON_WIDTH}px`,
                  transitionDuration: `${SWIPE_CONFIG.ANIMATION_DURATION}ms`,
                }}
                data-testid="swipe-delete-button"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">🗑</span>
                  <span className="text-xs font-medium">Delete</span>
                </div>
              </button>
            )}

            {/* Spacer in the middle */}
            <div className="flex-1" />

            {/* Cancel Action (swipe left reveals from right) - Only for active sessions */}
            {session.status === 'active' && (
              <button
                onClick={handleCancel}
                onKeyDown={handleKeyDown(handleCancel)}
                aria-label="Cancel this active loop"
                className="pointer-events-auto h-full bg-red-500 text-white px-4 flex items-center justify-center transition-transform ease-out"
                style={{
                  transform: `translateX(${swipeOffset}px)`,
                  minWidth: `${SWIPE_CONFIG.BUTTON_WIDTH}px`,
                  transitionDuration: `${SWIPE_CONFIG.ANIMATION_DURATION}ms`,
                }}
                data-testid="swipe-cancel-button"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">⏹</span>
                  <span className="text-xs font-medium">Cancel</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Card Header - Always Visible */}
        <div
          {...swipeHandlers}
          role="button"
          aria-expanded={isExpanded}
          aria-controls="session-detail"
          tabIndex={0}
          className="relative bg-white p-3 sm:p-4 cursor-pointer active:scale-[0.99] active:opacity-80 transition-transform z-10"
          onClick={() => {
            resetSwipe();
            setIsExpanded(!isExpanded);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              resetSwipe();
              setIsExpanded(!isExpanded);
            }
          }}
          style={
            isMobile ? { transform: `translateX(${swipeOffset}px)` } : undefined
          }
        >
          {/* Top Row: Status Badge + Expand Icon */}
          <div className="flex items-center justify-between mb-2">
            <StatusBadge status={session.status} />
            <span
              className={`transform transition-transform text-gray-400 ${
                isExpanded ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            >
              ▶
            </span>
          </div>

          {/* Project Name */}
          <h3 className="text-base sm:text-lg font-semibold text-claude-dark mb-1">
            {session.project_name}
          </h3>

          {/* Task Description (truncated) */}
          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
            {truncateTask(session.task, 100)}
          </p>

          {/* Separator */}
          <div className="border-t border-gray-100 my-3" />

          {/* Progress Bar + Iterations */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <ProgressBar
                current={session.iterations}
                max={session.max_iterations}
                size="sm"
                showLabel
                status={session.status}
                compact
              />
            </div>
          </div>

          {/* Time Info */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Started: {getTimeAgo(session.started_at)}</span>
            <span>•</span>
            <span>{formatDuration(session.duration_seconds)}</span>
          </div>
        </div>

        {/* Expanded SessionDetail */}
        {isExpanded && (
          <SessionDetail
            id="session-detail"
            session={session}
            onCancel={handleCancel}
            isCancelling={cancelMutation.isPending}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Loop?"
        message={`Are you sure you want to cancel the loop for "${session.project_name}"? This will delete the state file and stop the loop.`}
        confirmLabel="Cancel Loop"
        cancelLabel="Keep Running"
        onConfirm={confirmCancel}
        onCancel={() => {
          setShowCancelModal(false);
          resetSwipe();
        }}
        isLoading={cancelMutation.isPending}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Permanently?"
        message={`Are you sure you want to permanently delete "${session.project_name}" from history? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Keep in History"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          resetSwipe();
        }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
