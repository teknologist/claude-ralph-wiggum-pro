import type { Session, IterationEntry } from '../../server/types';

/**
 * Format duration in seconds to human-readable string.
 */
function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || seconds === 0) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Calculate duration between two timestamps.
 */
function calculateIterationDuration(
  currentTimestamp: string,
  nextTimestamp: string | null
): string {
  if (!nextTimestamp) return 'N/A';

  const start = new Date(currentTimestamp).getTime();
  const end = new Date(nextTimestamp).getTime();
  const diffSeconds = Math.round((end - start) / 1000);

  return formatDuration(diffSeconds);
}

/**
 * Get status emoji for session status.
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'success':
      return '✅';
    case 'active':
      return '⏳';
    case 'max_iterations':
      return '🔁';
    case 'cancelled':
      return '⏹';
    case 'error':
      return '❌';
    case 'abandoned':
      return '⏹';
    case 'orphaned':
      return '👻';
    default:
      return '❓';
  }
}

/**
 * Get status label for session status.
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'success':
      return 'Completed Successfully';
    case 'active':
      return 'In Progress';
    case 'max_iterations':
      return 'Max Iterations Reached';
    case 'cancelled':
      return 'Cancelled';
    case 'error':
      return 'Error';
    case 'abandoned':
      return 'Abandoned';
    case 'orphaned':
      return 'Orphaned';
    default:
      return 'Unknown';
  }
}

/**
 * Export session transcript as markdown.
 */
export function exportTranscriptAsMarkdown(
  session: Session,
  iterations: IterationEntry[]
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Ralph Loop Transcript`);
  lines.push('');

  // Session metadata
  lines.push('## Session Information');
  lines.push('');
  lines.push(`- **Project:** ${session.project_name}`);
  lines.push(`- **Loop ID:** \`${session.loop_id}\``);
  lines.push(`- **Session ID:** \`${session.session_id}\``);
  lines.push(`- **Started:** ${new Date(session.started_at).toLocaleString()}`);
  if (session.ended_at) {
    lines.push(`- **Ended:** ${new Date(session.ended_at).toLocaleString()}`);
  }
  lines.push(`- **Duration:** ${formatDuration(session.duration_seconds)}`);
  lines.push(
    `- **Iterations:** ${session.iterations ?? 'N/A'} / ${session.max_iterations}`
  );
  lines.push(
    `- **Status:** ${getStatusEmoji(session.status)} ${getStatusLabel(session.status)}`
  );
  if (session.completion_promise) {
    lines.push(`- **Completion Promise:** \`${session.completion_promise}\``);
  }
  lines.push('');

  // User prompt
  lines.push('## User Prompt');
  lines.push('');
  lines.push('```');
  lines.push(session.task || 'No task description');
  lines.push('```');
  lines.push('');

  // Iterations
  if (iterations.length > 0) {
    lines.push('## Iterations');
    lines.push('');

    iterations.forEach((iteration, index) => {
      const nextTimestamp =
        index < iterations.length - 1
          ? iterations[index + 1].timestamp
          : session.ended_at;
      const duration = calculateIterationDuration(
        iteration.timestamp,
        nextTimestamp
      );

      lines.push(`### Iteration ${iteration.iteration}`);
      lines.push('');
      lines.push(
        `- **Timestamp:** ${new Date(iteration.timestamp).toLocaleString()}`
      );
      lines.push(`- **Duration:** ${duration}`);
      lines.push('');
      lines.push('**Output:**');
      lines.push('');
      lines.push('```');
      lines.push(iteration.output);
      lines.push('```');
      lines.push('');
    });
  }

  // Completion status
  lines.push('## Result');
  lines.push('');
  lines.push(
    `${getStatusEmoji(session.status)} **${getStatusLabel(session.status)}**`
  );
  if (session.status === 'success' && session.completion_promise) {
    lines.push('');
    lines.push(
      `Promise fulfilled: \`<promise>${session.completion_promise}</promise>\``
    );
  }
  if (session.error_reason) {
    lines.push('');
    lines.push(`**Error:** ${session.error_reason}`);
  }
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(
    `*Exported from Ralph Wiggum Pro Dashboard on ${new Date().toLocaleString()}*`
  );

  return lines.join('\n');
}

/**
 * Trigger download of markdown file.
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate filename for export.
 */
export function generateExportFilename(session: Session): string {
  const projectName = session.project_name
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();
  const loopId = session.loop_id.slice(0, 8);
  return `${projectName}-${loopId}.md`;
}
