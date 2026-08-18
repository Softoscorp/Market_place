import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setToken } from '@/lib/api';

export type UserRole = 'student' | 'agent' | 'admin' | 'customer_care';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  token: string;
  loginTimestamp?: number;
  isVerifiedAgent?: boolean;
  is_verified?: boolean;
  verification_tier?: 'none' | 'local' | 'international';
  avatar_url?: string;
  respond_rate?: number;
  isLookingForRoommate?: boolean;
  last_seen_at?: string | null;
}

/**
 * Maps the backend /users/me (MeOut) shape onto the store's User.
 * Centralised so every auth entry point (login, signup, supabase callback)
 * persists the same fields — notably avatar_url — instead of dropping them
 * and waiting for a later validateToken() refetch to fill them in.
 */
export function mapBackendUser(
  me: {
    id: number | string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    is_verified?: boolean;
    verification_tier?: string;
    avatar_url?: string | null;
    respond_rate?: number | null;
    last_seen_at?: string | null;
  },
  token: string
): User {
  return {
    id: me.id.toString(),
    name: me.name,
    email: me.email,
    phone: me.phone || undefined,
    role: me.role === 'renter' ? 'student' : (me.role as UserRole),
    token,
    isVerifiedAgent: me.is_verified ?? undefined,
    is_verified: me.is_verified ?? undefined,
    verification_tier: (me.verification_tier as User['verification_tier']) || undefined,
    avatar_url: me.avatar_url || undefined,
    respond_rate: me.respond_rate ?? undefined,
    last_seen_at: me.last_seen_at || new Date().toISOString(),
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True once the persisted store has rehydrated from localStorage.
   * Guards must wait for this before redirecting, or a refresh on a
   * protected page flashes the login/signup page first. */
  hasHydrated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  verifyAgent: () => void;
  toggleRoommateSearch: () => void;
  validateToken: () => Promise<void>;
  checkSessionExpiration: () => boolean;
  updateUser: (partial: Partial<User>) => void;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      login: (userData) => {
        if (userData.token) {
          setToken(userData.token);
        }
        set({
          user: {
            ...userData,
            loginTimestamp: userData.loginTimestamp || Date.now(),
          },
          isAuthenticated: true,
        });
        // Register FCM/web-push token after login
        import('@/lib/pushNotifications').then(m => m.initPushNotifications()).catch(() => {});
      },

      // Safe merge: always reads current state via get() so stale closures can't overwrite newer data
      updateUser: (partial: Partial<User>) => {
        const current = get();
        if (!current.user) return;
        set({ user: { ...current.user, ...partial } });
      },

      logout: () => {
        // Clear token reference
        setToken(null);
        // Wipe ALL auth storage keys synchronously before any redirect
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('rental_platform_token');
          window.localStorage.removeItem('house-agent-auth');
        }
        // Clear Zustand state
        set({ user: null, isAuthenticated: false });
      },

      verifyAgent: () =>
        set((state) => ({
          user: state.user ? { ...state.user, isVerifiedAgent: true } : null,
        })),

      toggleRoommateSearch: () =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                isLookingForRoommate: !state.user.isLookingForRoommate,
              }
            : null,
        })),

      // Sessions persist until the backend token expires (validated server-side).
      // No client-side timeout forces logout.
      checkSessionExpiration: () => {
        const { isAuthenticated, user } = get();
        if (!isAuthenticated || !user) return false;
        return false; // Never force-logout client-side
      },

      // Validates stored JWT against the backend
      validateToken: async () => {
        const { user } = get();
        if (!user?.token) return;

        try {
          const res = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          if (res.ok) {
            const freshUser = await res.json();
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    name: freshUser.name || state.user.name,
                    phone: freshUser.phone || state.user.phone,
                    // Only overwrite avatar_url if backend returned a real, non-empty value
                    avatar_url: freshUser.avatar_url ? freshUser.avatar_url : state.user.avatar_url,
                    is_verified: freshUser.is_verified ?? state.user.is_verified,
                    last_seen_at: freshUser.last_seen_at || state.user.last_seen_at,
                  }
                : null,
            }));
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          // Network error — don't log out, could be temporary
        }
      },
    }),
    { name: 'house-agent-auth',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Rehydration is synchronous for localStorage, so by the time this
        // callback runs the store has already been populated. Flip the flag
        // on the next tick (store is fully assigned) so subscribed guards
        // re-render and can proceed without a login-page flash.
        setTimeout(() => {
          useAuthStore.setState({ hasHydrated: true });
        }, 0);
      },
    }
  )
);
