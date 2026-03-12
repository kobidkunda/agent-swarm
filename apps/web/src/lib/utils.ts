import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString();
}

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    stale: 'bg-yellow-500',
    healthy: 'bg-green-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-500',
    queued: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    stopped: 'bg-gray-500',
    force_stopped: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function getPhaseColor(phase: string): string {
  const colors: Record<string, string> = {
    queued: 'text-blue-500',
    matching: 'text-purple-500',
    claiming: 'text-purple-500',
    preparing_workspace: 'text-yellow-500',
    starting_agent: 'text-yellow-500',
    reproducing_issue: 'text-orange-500',
    analyzing_code: 'text-orange-500',
    editing_code: 'text-orange-500',
    running_tests: 'text-cyan-500',
    running_rest_checks: 'text-cyan-500',
    running_browser_checks: 'text-cyan-500',
    running_mobile_checks: 'text-cyan-500',
    collecting_artifacts: 'text-teal-500',
    awaiting_approval: 'text-pink-500',
    creating_pr: 'text-indigo-500',
  };
  return colors[phase] || 'text-gray-500';
}
