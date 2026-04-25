// User and Role Types
export type UserRole = 'Admin' | 'SalesManager' | 'SalesMember';
export type PotentialLevel = 'A' | 'B' | 'C';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  managerId?: string;
  managerName?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  address?: string;
  createdAt: string;
  doctorCount: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  phone: string;
  zalo?: string;
  hospitalId: string;
  hospitalName?: string;
  address?: string;
  potentialLevel: PotentialLevel;
  assignedSalesId?: string;
  assignedSalesName?: string;
  createdAt: string;
}

// API Request/Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateDoctorRequest {
  name: string;
  specialty?: string;
  phone: string;
  zalo?: string;
  hospitalId: string;
  address?: string;
  potentialLevel: PotentialLevel;
  assignedSalesId?: string;
}

export interface CreateHospitalRequest {
  name: string;
  address?: string;
}