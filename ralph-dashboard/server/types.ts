// Log entry types (as stored in JSONL)
export interface StartLogEntry {
  loop_id: string; // Unique per loop invocation
  session_id: string; // Claude Code terminal session (for grouping)
  status: 'active';
  project: string;
  project_name: string;
  state_file_path: string;
  task: string;
  started_at: string;
  max_iterations: number;
  completion_promise: string | null;
}

export interface CompletionLogEntry {
  loop_id: string; // Unique per loop invocation
  session_id: string; // Claude Code terminal session (for grouping)
  status: 'completed';
  outcome: 'success' | 'max_iterations' | 'cancelled' | 'error';
  ended_at: string;
  duration_seconds: number;
  iterations: number;
  error_reason?: string | null;
}

export type LogEntry = StartLogEntry | CompletionLogEntry;

// Merged session type (for API responses)
export interface Session {
  loop_id: string; // Unique per loop invocation (primary identifier)
  session_id: string; // Claude Code terminal session (for grouping)
  status: 'active' | 'success' | 'cancelled' | 'error' | 'max_iterations';
  outcome?: 'success' | 'cancelled' | 'error' | 'max_iterations';
  project: string;
  project_name: string;
  state_file_path: string;
  task: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  iterations: number | null;
  max_iterations: number;
  completion_promise: string | null;
  error_reason: string | null;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  active_count: number;
}

export interface CancelResponse {
  success: boolean;
  message: string;
  loop_id: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  loop_id: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
