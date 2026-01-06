import type { Session } from '../../server/types';

interface StatsBarProps {
  sessions: Session[];
  activeCount: number;
}

export function StatsBar({ sessions, activeCount }: StatsBarProps) {
  const completedSessions = sessions.filter((s) => s.status !== 'active');

  const successCount = completedSessions.filter(
    (s) => s.status === 'success'
  ).length;
  const successRate =
    completedSessions.length > 0
      ? Math.round((successCount / completedSessions.length) * 100)
      : 0;

  const totalDuration = completedSessions.reduce(
    (sum, s) => sum + (s.duration_seconds ?? 0),
    0
  );
  const avgDuration =
    completedSessions.length > 0
      ? Math.round(totalDuration / completedSessions.length)
      : 0;

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div
      className="bg-white dark:bg-claude-dark rounded-lg shadow-md p-4 sm:p-6 mb-6"
      data-testid="stats-bar"
    >
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Loops"
          value={sessions.length.toString()}
          icon="📊"
        />
        <StatCard
          label="Active"
          value={activeCount.toString()}
          icon="🔄"
          highlight={activeCount > 0}
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon="✅"
          subtext={`${successCount}/${completedSessions.length}`}
        />
        <StatCard
          label="Avg Duration"
          value={formatDuration(avgDuration)}
          icon="⏱️"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  subtext?: string;
  highlight?: boolean;
}

function StatCard({ label, value, icon, subtext, highlight }: StatCardProps) {
  return (
    <div
      data-testid="stat-card"
      className={`p-3 sm:p-4 rounded-lg ${
        highlight
          ? 'bg-claude-coral/10 dark:bg-claude-coral/20 border border-claude-coral'
          : 'bg-gray-50 dark:bg-claude-dark'
      }`}
    >
      <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 mb-1">
        <span className="text-sm sm:text-base">{icon}</span>
        <span className="text-xs sm:text-sm font-medium">{label}</span>
      </div>
      <div
        className={`text-xl sm:text-2xl font-bold ${
          highlight
            ? 'text-claude-coral'
            : 'text-claude-dark dark:text-zinc-100'
        }`}
      >
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
}
