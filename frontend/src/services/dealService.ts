import api from './api';
import {
  Deal,
  CreateDealRequest,
  UpdateDealRequest,
  UpdateStageRequest,
  PipelineResponse,
  ForecastResponse,
} from '../types';

export const dealService = {
  createDeal: async (data: CreateDealRequest): Promise<Deal> => {
    const response = await api.post('/deals', data);
    return response.data;
  },

  getDeal: async (id: string): Promise<Deal> => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },

  updateDeal: async (id: string, data: UpdateDealRequest): Promise<Deal> => {
    const response = await api.put(`/deals/${id}`, data);
    return response.data;
  },

  deleteDeal: async (id: string): Promise<void> => {
    await api.delete(`/deals/${id}`);
  },

  getPipeline: async (): Promise<PipelineResponse> => {
    const response = await api.get('/deals/pipeline');
    return response.data;
  },

  getForecast: async (): Promise<ForecastResponse> => {
    const response = await api.get('/deals/forecast');
    return response.data;
  },

  updateStage: async (id: string, stage: string): Promise<Deal> => {
    const response = await api.put(`/deals/${id}/stage`, { stage });
    return response.data;
  },
};