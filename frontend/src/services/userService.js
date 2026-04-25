import api from './api';
export const userService = {
    getAll: async (filters) => {
        const params = new URLSearchParams();
        if (filters?.role)
            params.append('role', filters.role);
        if (filters?.managerId)
            params.append('managerId', filters.managerId);
        if (filters?.status)
            params.append('status', filters.status);
        const response = await api.get(`/users?${params.toString()}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/users/${id}`);
    },
    getSalesMembers: async (managerId) => {
        const params = managerId ? `?managerId=${managerId}` : '';
        const response = await api.get(`/users/sales-members${params}`);
        return response.data;
    },
    getManagers: async () => {
        const response = await api.get('/users/managers');
        return response.data;
    },
    getTeam: async (managerId) => {
        const response = await api.get(`/users/${managerId}/team`);
        return response.data;
    },
    updateAvatar: async (id, avatarUrl) => {
        const response = await api.put(`/users/${id}/avatar`, { avatarUrl });
        return response.data;
    },
};
