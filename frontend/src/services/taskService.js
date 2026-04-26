import api from './api';
export const taskService = {
    getTodayTasks: async () => {
        const response = await api.get('/api/tasks/today');
        return response.data;
    },
    updateTemperature: async (doctorId, temperature) => {
        await api.post(`/api/doctors/${doctorId}/temperature`, { temperature });
    },
    snooze: async (doctorId, days) => {
        await api.post(`/api/doctors/${doctorId}/snooze`, { days });
    },
};
