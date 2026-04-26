import api from './api';
import type { Order, OrderListResponse, OrderStatus } from '../types';

export const orderService = {
  getOrders: async (status?: OrderStatus, doctorId?: string): Promise<OrderListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (doctorId) params.append('doctorId', doctorId);
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  approve: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/approve`);
    return response.data;
  },

  markReady: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/ready`);
    return response.data;
  },

  ship: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/ship`);
    return response.data;
  },

  complete: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/complete`);
    return response.data;
  },
};