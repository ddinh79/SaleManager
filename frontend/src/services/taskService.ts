import api from './api';
import { TaskItem, TasksResponse, TaskFilter } from '../types';

export const taskService = {
  getTasks: async (filter?: TaskFilter): Promise<TasksResponse> => {
    const params = filter && filter !== 'ALL' ? { filter } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  snoozeTask: async (taskId: string, taskType: string, days: number): Promise<void> => {
    await api.post(`/tasks/${taskId}/snooze?type=${taskType}`, { days });
  },

  completeTask: async (taskId: string, taskType: string): Promise<void> => {
    await api.post(`/tasks/${taskId}/complete?type=${taskType}`);
  },
};