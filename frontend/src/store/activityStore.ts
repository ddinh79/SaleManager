import { create } from 'zustand';
import { activityService, type Activity } from '../services/activityService';

interface ActivityState {
  activities: Activity[];
  selectedDoctorId: string | null;
  isLoading: boolean;
  error: string | null;
  quickAddOpen: boolean;
  setSelectedDoctor: (id: string | null) => void;
  setQuickAddOpen: (open: boolean) => void;
  fetchTimeline: (doctorId?: string) => Promise<void>;
  createActivity: (data: Parameters<typeof activityService.createActivity>[0]) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  selectedDoctorId: null,
  isLoading: false,
  error: null,
  quickAddOpen: false,

  setSelectedDoctor: (id) => set({ selectedDoctorId: id }),

  setQuickAddOpen: (open) => set({ quickAddOpen: open }),

  fetchTimeline: async (doctorId) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await activityService.getTimeline(doctorId);
      set({ activities, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createActivity: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await activityService.createActivity(data);
      const { selectedDoctorId } = get();
      await get().fetchTimeline(selectedDoctorId || undefined);
      set({ quickAddOpen: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));