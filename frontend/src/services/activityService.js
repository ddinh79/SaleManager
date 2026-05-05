import api from './api';
export const activityService = {
    createActivity: async (data) => {
        const response = await api.post('/activities', data);
        return response.data;
    },
    getActivities: async (filters) => {
        const params = new URLSearchParams();
        if (filters?.doctorId)
            params.append('doctorId', filters.doctorId);
        if (filters?.from)
            params.append('from', filters.from);
        if (filters?.to)
            params.append('to', filters.to);
        if (filters?.type)
            params.append('type', filters.type);
        const response = await api.get(`/activities?${params}`);
        return response.data;
    },
    getTimeline: async (doctorId) => {
        const params = doctorId ? `?doctorId=${doctorId}` : '';
        const response = await api.get(`/activities/timeline${params}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/activities/${id}`);
        return response.data;
    },
};
