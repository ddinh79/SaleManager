import api from './api';
import { Hospital, CreateHospitalRequest } from '../types';

export const hospitalService = {
  getHospitals: async (): Promise<Hospital[]> => {
    const response = await api.get('/hospitals');
    return response.data;
  },

  getHospital: (id: string): Promise<Hospital> => {
    return api.get(`/hospitals/${id}`);
  },

  createHospital: (data: CreateHospitalRequest): Promise<Hospital> => {
    return api.post('/hospitals', data);
  },

  updateHospital: (id: string, data: CreateHospitalRequest): Promise<Hospital> => {
    return api.put(`/hospitals/${id}`, data);
  },

  deleteHospital: (id: string): Promise<void> => {
    return api.delete(`/hospitals/${id}`);
  },
};