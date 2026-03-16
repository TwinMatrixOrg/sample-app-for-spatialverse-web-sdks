/**
 * Time Formatting Utilities
 * 
 * Helper functions for formatting timestamps in a user-friendly way.
 */

/**
 * Format a timestamp as relative time (e.g., "5 min ago", "2 hr ago")
 */
export function formatRelativeTime(timestamp: string | number, timezone?: string): string {
  const alertDate = new Date(timestamp);
  const now = new Date();

  const diffMs = now.getTime() - alertDate.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}
