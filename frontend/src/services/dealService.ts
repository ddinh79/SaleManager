import api from './api';
import {
  Deal,
  CreateDealRequest,
  UpdateDealRequest,
  UpdateStageRequest,
  PipelineResponse,
  ForecastResponse,
  DealStage,
  LostReason,
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

  getPipeline: async (limit = 50): Promise<PipelineResponse> => {
    const response = await api.get('/deals/pipeline', { params: { limit } });
    return response.data;
  },

  getForecast: async (): Promise<ForecastResponse> => {
    const response = await api.get('/deals/forecast');
    return response.data;
  },

  /**
   * Update deal stage with full business logic.
   * @param id - Deal ID
   * @param stage - New stage
   * @param expectedVersion - Optional version for concurrency check
   * @param lostReason - Required when moving to LOST stage
   * @param lostNotes - Optional notes for LOST reason
   */
  updateStage: async (
    id: string,
    stage: DealStage,
    expectedVersion?: number,
    lostReason?: LostReason,
    lostNotes?: string
  ): Promise<Deal> => {
    const response = await api.put(`/deals/${id}/stage`, {
      stage,
      expectedVersion,
      lostReason,
      lostNotes,
    });
    return response.data;
  },

  /**
   * Rebalance positions within a stage column.
   * Used when gaps become too small.
   */
  rebalanceStage: async (stage: DealStage): Promise<void> => {
    await api.post(`/deals/${'rebalance'}`, null, { params: { stage } });
  },
};