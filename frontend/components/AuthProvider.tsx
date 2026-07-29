'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { pingPresence } from '@/lib/api';

const PING_INTERVAL_MS = 60_000; // stamp last_seen_at every 60 seconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const validateToken = useAuthStore((s) => s.validateToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Validate token on mount
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Heartbeat — keeps last_seen_at fresh while the user is active
  useEffect(() => {
    if (!isAuthenticated) return;

    // Ping immediately so we don't wait 60s for the first stamp
    pingPresence();

    const interval = setInterval(pingPresence, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return <>{children}</>;
}
