import { create } from 'zustand';
import { activityService } from '../services/activityService';
export const useActivityStore = create((set, get) => ({
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
        }
        catch (error) {
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
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));
