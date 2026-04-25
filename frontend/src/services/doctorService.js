import api from './api';
export const doctorService = {
    getDoctors: (params) => {
        return api.get('/doctors', { params });
    },
    getDoctor: (id) => {
        return api.get(`/doctors/${id}`);
    },
    createDoctor: (data) => {
        return api.post('/doctors', data);
    },
    updateDoctor: (id, data) => {
        return api.put(`/doctors/${id}`, data);
    },
    deleteDoctor: (id) => {
        return api.delete(`/doctors/${id}`);
    },
    getAssignedDoctors: () => {
        return api.get('/doctors/assigned');
    },
};
