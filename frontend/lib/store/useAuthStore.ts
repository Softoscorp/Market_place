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
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (userData) => set({ user: userData, isAuthenticated: true }),

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

      // Validates the stored JWT against the backend.
      // If invalid or expired, clears the session.
      validateToken: async () => {
        const { user } = get();
        if (!user?.token) return;
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
