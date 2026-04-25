import api from './api';
import { LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return api.post('/auth/login', data);
  },
};