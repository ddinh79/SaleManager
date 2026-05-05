import api from './api';
export const hospitalService = {
    getHospitals: async () => {
        const response = await api.get('/hospitals');
        return response.data;
    },
    getHospital: (id) => {
        return api.get(`/hospitals/${id}`);
    },
    createHospital: (data) => {
        return api.post('/hospitals', data);
    },
    updateHospital: (id, data) => {
        return api.put(`/hospitals/${id}`, data);
    },
    deleteHospital: (id) => {
        return api.delete(`/hospitals/${id}`);
    },
};
