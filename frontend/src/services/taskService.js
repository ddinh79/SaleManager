import api from './api';
export const taskService = {
    getTasks: async (filter) => {
        const params = filter && filter !== 'ALL' ? { filter } : {};
        const response = await api.get('/tasks', { params });
        return response.data;
    },
    snoozeTask: async (taskId, taskType, days) => {
        await api.post(`/tasks/${taskId}/snooze?type=${taskType}`, { days });
    },
    completeTask: async (taskId, taskType) => {
        await api.post(`/tasks/${taskId}/complete?type=${taskType}`);
    },
};
