import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useUiStore = create()(persist((set) => ({
    sidebarCollapsed: false,
    searchModalOpen: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    openSearchModal: () => set({ searchModalOpen: true }),
    closeSearchModal: () => set({ searchModalOpen: false }),
}), { name: 'ui-storage' }));
