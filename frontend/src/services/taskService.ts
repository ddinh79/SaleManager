import api from './api';

export interface TaskItem {
  doctorId: string;
  doctorName: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  lastActivityAt: string | null;
  nextFollowUpAt: string;
  isOverdue: boolean;
  lastActivityType: string | null;
}

export interface UpdateTemperatureRequest {
  temperature: 'HOT' | 'WARM' | 'COLD';
}

export interface SnoozeRequest {
  days: number;
}

export const taskService = {
  getTodayTasks: async (): Promise<TaskItem[]> => {
    const response = await api.get('/api/tasks/today');
    return response.data;
  },

  updateTemperature: async (doctorId: string, temperature: 'HOT' | 'WARM' | 'COLD'): Promise<void> => {
    await api.post(`/api/doctors/${doctorId}/temperature`, { temperature });
  },

  snooze: async (doctorId: string, days: number): Promise<void> => {
    await api.post(`/api/doctors/${doctorId}/snooze`, { days });
  },
};