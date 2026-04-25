import api from './api';
import { User, UserRole } from '../types';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  managerId?: string;
  avatarUrl?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  managerId?: string;
  avatarUrl?: string;
}

export interface UserFilters {
  role?: UserRole;
  managerId?: string;
  status?: 'active' | 'inactive';
}

export const userService = {
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.managerId) params.append('managerId', filters.managerId);
    if (filters?.status) params.append('status', filters.status);
    const response = await api.get<User[]>(`/users?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  getSalesMembers: async (managerId?: string): Promise<User[]> => {
    const params = managerId ? `?managerId=${managerId}` : '';
    const response = await api.get<User[]>(`/users/sales-members${params}`);
    return response.data;
  },

  getManagers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/managers');
    return response.data;
  },

  getTeam: async (managerId: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/${managerId}/team`);
    return response.data;
  },

  updateAvatar: async (id: string, avatarUrl: string): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/avatar`, { avatarUrl });
    return response.data;
  },
};