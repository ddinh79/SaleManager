import api from './api';
import type { AxiosResponse } from 'axios';
import { LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
    return api.post<LoginResponse>('/auth/login', data);
  },
};