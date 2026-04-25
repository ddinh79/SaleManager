import { create } from 'zustand';

interface FilterState {
  doctorIdFilter: string | null;
  roleFilter: string | null;
  statusFilter: string | null;
  setDoctorIdFilter: (id: string | null) => void;
  setRoleFilter: (role: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  doctorIdFilter: null,
  roleFilter: null,
  statusFilter: null,
  setDoctorIdFilter: (id) => set({ doctorIdFilter: id }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  clearFilters: () => set({ doctorIdFilter: null, roleFilter: null, statusFilter: null }),
}));