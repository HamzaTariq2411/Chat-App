import { api } from '@/lib/api';
import type { AuthResponse } from '@/types';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const registerRequest = async (name: string, username: string, email: string, password: string) => {
  const res = await api.post<ApiEnvelope<AuthResponse>>('/auth/register', { name, username, email, password });
  return res.data.data;
};

export const loginRequest = async (email: string, password: string) => {
  const res = await api.post<ApiEnvelope<AuthResponse>>('/auth/login', { email, password });
  return res.data.data;
};