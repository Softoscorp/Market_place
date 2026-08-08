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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
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
    { name: 'house-agent-auth' }
  )
);
