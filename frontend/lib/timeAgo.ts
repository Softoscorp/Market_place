import { TranslationKey } from './i18n/translations';

/**
 * Returns true if the user was seen within the last 5 minutes.
 */
export function isOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const date = new Date(lastSeenAt.endsWith('Z') ? lastSeenAt : lastSeenAt + 'Z');
  const diff = Date.now() - date.getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

export interface LastSeenTextResult {
  key: TranslationKey;
  params?: Record<string, string>;
}

/**
 * Returns a translation key + params for a human-readable "last seen" string.
 * Caller renders it via t(key, params). Examples: "Online now", "Last seen 3 min ago".
 */
export function lastSeenText(lastSeenAt: string | null | undefined): LastSeenTextResult {
  if (!lastSeenAt) return { key: 'common_offline' };

  const date = new Date(lastSeenAt.endsWith('Z') ? lastSeenAt : lastSeenAt + 'Z');
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return { key: 'common_online_now' };
  if (diffMin < 60) return { key: 'chat_last_seen_min', params: { count: String(diffMin) } };

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return { key: 'chat_last_seen_hour', params: { count: String(diffHours) } };

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { key: 'chat_last_seen_yesterday' };
  if (diffDays < 7) return { key: 'chat_last_seen_days', params: { count: String(diffDays) } };

  return { key: 'common_offline' };
}
