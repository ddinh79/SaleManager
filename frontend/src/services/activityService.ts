import api from './api';

export interface CreateActivityRequest {
  doctorId: string;
  type: 'CALL' | 'MESSAGE' | 'MEETING' | 'DEMO' | 'SAMPLE_SENT';
  content: string;
  result?: string;
  nextFollowUpAt?: string;
  lat?: number;
  lng?: number;
  deviceId?: string;
}

export interface Activity {
  id: string;
  salesId: string;
  salesName: string;
  doctorId: string;
  doctorName: string;
  type: string;
  content: string;
  result?: string;
  nextFollowUpAt?: string;
  checkinLat?: number;
  checkinLng?: number;
  gpsStatus: 'VALID' | 'SUSPICIOUS' | 'MISSING';
  distanceMeters?: number;
  createdAt: string;
}

export interface ActivityFilters {
  doctorId?: string;
  from?: string;
  to?: string;
  type?: string;
}

export const activityService = {
  createActivity: async (data: CreateActivityRequest): Promise<Activity> => {
    const response = await api.post('/activities', data);
    return response.data;
  },

  getActivities: async (filters?: ActivityFilters): Promise<Activity[]> => {
    const params = new URLSearchParams();
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.type) params.append('type', filters.type);
    const response = await api.get(`/activities?${params}`);
    return response.data;
  },

  getTimeline: async (doctorId?: string): Promise<Activity[]> => {
    const params = doctorId ? `?doctorId=${doctorId}` : '';
    const response = await api.get(`/activities/timeline${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },
};