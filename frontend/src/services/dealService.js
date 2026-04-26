import api from './api';
export const dealService = {
    createDeal: async (data) => {
        const response = await api.post('/deals', data);
        return response.data;
    },
    getDeal: async (id) => {
        const response = await api.get(`/deals/${id}`);
        return response.data;
    },
    updateDeal: async (id, data) => {
        const response = await api.put(`/deals/${id}`, data);
        return response.data;
    },
    deleteDeal: async (id) => {
        await api.delete(`/deals/${id}`);
    },
    getPipeline: async () => {
        const response = await api.get('/deals/pipeline');
        return response.data;
    },
    getForecast: async () => {
        const response = await api.get('/deals/forecast');
        return response.data;
    },
    updateStage: async (id, stage) => {
        const response = await api.put(`/deals/${id}/stage`, { stage });
        return response.data;
    },
};
