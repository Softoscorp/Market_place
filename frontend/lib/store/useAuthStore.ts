import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  avatar_url?: string;
  isLookingForRoommate?: boolean;
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
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (userData) =>
        set({
          user: {
            ...userData,
            loginTimestamp: userData.loginTimestamp || Date.now(),
          },
          isAuthenticated: true,
        }),

      logout: () => set({ user: null, isAuthenticated: false }),

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

      // Checks if the 4-hour session window has expired
      checkSessionExpiration: () => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return false;
        
        if (user.loginTimestamp && Date.now() - user.loginTimestamp > FOUR_HOURS_MS) {
          set({ user: null, isAuthenticated: false });
          return true; // Expired
        }
        return false; // Still valid
      },

      // Validates stored JWT & checks 4-hour session timeout
      validateToken: async () => {
        const { user, checkSessionExpiration } = get();
        if (!user?.token) return;

        // Automatically log out if session is older than 4 hours
        if (checkSessionExpiration()) return;

        try {
          const res = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          if (!res.ok) {
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
