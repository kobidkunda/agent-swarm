export * from './types';

export const RUN_PHASES = [
  'queued',
  'matching',
  'claiming',
  'preparing_workspace',
  'starting_agent',
  'reproducing_issue',
  'analyzing_code',
  'editing_code',
  'running_tests',
  'running_rest_checks',
  'running_browser_checks',
  'running_mobile_checks',
  'collecting_artifacts',
  'awaiting_approval',
  'creating_pr',
] as const;

export const TERMINAL_RUN_STATUSES = [
  'completed',
  'failed',
  'stopped',
  'force_stopped',
  'timed_out',
  'abandoned',
] as const;

export const LOCK_TYPES = ['scheduler', 'repo', 'folder', 'issue', 'branch'] as const;

export const STOP_STATES = ['none', 'stop_requested', 'graceful_stopping', 'force_stop_requested'] as const;

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_RUN_STATUSES.includes(status as any);
}

export function isActiveRun(status: string): boolean {
  return !isTerminalStatus(status);
}
