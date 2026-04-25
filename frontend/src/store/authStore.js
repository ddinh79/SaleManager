import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const ROLES = {
    ADMIN: 'Admin',
    SALES_MANAGER: 'SalesManager',
    SALES_MEMBER: 'SalesMember',
};
export const ROLE_LABELS = {
    Admin: 'Admin',
    SalesManager: 'Sales Manager',
    SalesMember: 'Sales Member',
};
export const useAuthStore = create()(persist((set, get) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    login: (token, user) => set({ token, user, isAuthenticated: true }),
    logout: () => set({ token: null, user: null, isAuthenticated: false }),
    hasRole: (roles) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
    },
}), { name: 'auth-storage' }));
