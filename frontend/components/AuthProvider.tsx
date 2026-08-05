'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { pingPresence } from '@/lib/api';

const PING_INTERVAL_MS = 60_000; // stamp last_seen_at every 60 seconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const validateToken = useAuthStore((s) => s.validateToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Validate token on mount
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Init push notifications whenever the user is (or becomes) authenticated.
  // This covers both fresh logins AND returning users who were already logged in
  // when a new APK was installed (so the permission dialog always fires).
  useEffect(() => {
    if (!isAuthenticated) return;
    import('@/lib/pushNotifications')
      .then((m) => m.initPushNotifications())
      .catch(() => {});
  }, [isAuthenticated]);

  // Heartbeat — keeps last_seen_at fresh while the user is active
  useEffect(() => {
    if (!isAuthenticated) return;

    const pingAndUpdate = () => {
      pingPresence();
      updateUser({ last_seen_at: new Date().toISOString() });
    };

    // Ping immediately so we don't wait 60s for the first stamp
    pingAndUpdate();

    const interval = setInterval(pingAndUpdate, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, updateUser]);

  return <>{children}</>;
}
