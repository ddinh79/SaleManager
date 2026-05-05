import api from './api';
import { Doctor, CreateDoctorRequest, PaginatedResponse } from '../types';

export const doctorService = {
  getDoctors: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    potentialLevel?: string;
    hospitalId?: string;
  }): Promise<PaginatedResponse<Doctor>> => {
    return api.get('/doctors', { params });
  },

  getDoctor: (id: string): Promise<Doctor> => {
    return api.get(`/doctors/${id}`);
  },

  createDoctor: (data: CreateDoctorRequest): Promise<Doctor> => {
    return api.post('/doctors', data);
  },

  updateDoctor: (id: string, data: CreateDoctorRequest): Promise<Doctor> => {
    return api.put(`/doctors/${id}`, data);
  },

  deleteDoctor: (id: string): Promise<void> => {
    return api.delete(`/doctors/${id}`);
  },

  getAssignedDoctors: async (): Promise<Doctor[]> => {
    const response = await api.get('/doctors/assigned');
    return response.data;
  },
};