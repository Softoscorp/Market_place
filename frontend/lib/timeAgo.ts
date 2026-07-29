/**
 * Returns true if the user was seen within the last 5 minutes.
 */
export function isOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const date = new Date(lastSeenAt.endsWith('Z') ? lastSeenAt : lastSeenAt + 'Z');
  const diff = Date.now() - date.getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

/**
 * Returns a human-readable "last seen" string.
 * Examples: "Online now", "Last seen 3 min ago", "Last seen 2 hours ago"
 */
export function lastSeenText(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return 'Offline';

  const date = new Date(lastSeenAt.endsWith('Z') ? lastSeenAt : lastSeenAt + 'Z');
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Online now';
  if (diffMin < 60) return `Last seen ${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays} days ago`;

  return 'Offline';
}
