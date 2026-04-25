import { create } from 'zustand';
export const useFilterStore = create((set) => ({
    doctorIdFilter: null,
    roleFilter: null,
    statusFilter: null,
    setDoctorIdFilter: (id) => set({ doctorIdFilter: id }),
    setRoleFilter: (role) => set({ roleFilter: role }),
    setStatusFilter: (status) => set({ statusFilter: status }),
    clearFilters: () => set({ doctorIdFilter: null, roleFilter: null, statusFilter: null }),
}));
