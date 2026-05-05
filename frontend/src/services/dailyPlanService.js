import api from './api';
export const dailyPlanService = {
    getTodayPlan: async () => {
        const response = await api.get('/daily-plan');
        return response.data;
    },
    getPlanForDate: async (date) => {
        const response = await api.get(`/daily-plan/${date}`);
        return response.data;
    },
    completeTask: async (taskId, request) => {
        await api.post(`/daily-plan/${taskId}/complete`, request);
    },
    skipTask: async (taskId, request) => {
        await api.post(`/daily-plan/${taskId}/skip`, request);
    },
    activateTask: async (taskId) => {
        await api.post(`/daily-plan/${taskId}/activate`);
    },
    getCapacity: async () => {
        const response = await api.get('/daily-plan/capacity');
        return response.data;
    },
    updateCapacity: async (request) => {
        const response = await api.put('/daily-plan/capacity', request);
        return response.data;
    },
    getTeamPlans: async (date) => {
        const params = date ? { date } : {};
        const response = await api.get('/daily-plan/team', { params });
        return response.data;
    },
};
