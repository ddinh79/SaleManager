import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

export const ROLES = {
  ADMIN: 'Admin' as UserRole,
  SALES_MANAGER: 'SalesManager' as UserRole,
  SALES_MEMBER: 'SalesMember' as UserRole,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Admin',
  SalesManager: 'Sales Manager',
  SalesMember: 'Sales Member',
};

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token: string, user: User) =>
        set({ token, user, isAuthenticated: true }),
      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),
      hasRole: (roles: UserRole[]) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },
    }),
    { name: 'auth-storage' }
  )
);