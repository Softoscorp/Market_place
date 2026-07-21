import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'student' | 'agent' | 'admin' | 'customer_care';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerifiedAgent?: boolean;
  isLookingForRoommate?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  verifyAgent: () => void;
  toggleRoommateSearch: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (userData) => set({ user: userData, isAuthenticated: true }),
      
      logout: () => set({ user: null, isAuthenticated: false }),
      
      verifyAgent: () => set((state) => ({
        user: state.user ? { ...state.user, isVerifiedAgent: true } : null
      })),
      
      toggleRoommateSearch: () => set((state) => ({
        user: state.user ? { ...state.user, isLookingForRoommate: !state.user.isLookingForRoommate } : null
      }))
    }),
    {
      name: 'house-agent-auth', // localStorage key
    }
  )
);
