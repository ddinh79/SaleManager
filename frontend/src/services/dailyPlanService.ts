import api from './api';
import { DailyPlan, CapacityInfo, ManualCompleteRequest, SkipTaskRequest, TeamDailyPlan } from '../types';

export const dailyPlanService = {
  getTodayPlan: async (): Promise<DailyPlan> => {
    const response = await api.get('/daily-plan');
    return response.data;
  },

  getPlanForDate: async (date: string): Promise<DailyPlan> => {
    const response = await api.get(`/daily-plan/${date}`);
    return response.data;
  },

  completeTask: async (taskId: string, request: ManualCompleteRequest): Promise<void> => {
    await api.post(`/daily-plan/${taskId}/complete`, request);
  },

  skipTask: async (taskId: string, request: SkipTaskRequest): Promise<void> => {
    await api.post(`/daily-plan/${taskId}/skip`, request);
  },

  activateTask: async (taskId: string): Promise<void> => {
    await api.post(`/daily-plan/${taskId}/activate`);
  },

  getCapacity: async (): Promise<CapacityInfo> => {
    const response = await api.get('/daily-plan/capacity');
    return response.data;
  },

  updateCapacity: async (request: Partial<CapacityInfo>): Promise<CapacityInfo> => {
    const response = await api.put('/daily-plan/capacity', request);
    return response.data;
  },

  getTeamPlans: async (date?: string): Promise<TeamDailyPlan> => {
    const params = date ? { date } : {};
    const response = await api.get('/daily-plan/team', { params });
    return response.data;
  },
};