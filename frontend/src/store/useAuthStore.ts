import { create } from 'zustand';
import api from '../lib/axios';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'RESTAURANT' | 'RIDER' | 'ADMIN';
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,

  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/v1/auth/login', { email, password, rememberMe });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      set({
        isLoading: false,
        error: message,
        isAuthenticated: false,
        user: null,
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // call logout endpoint if server has any cleanup (optional but good practice)
      await api.post('/v1/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null, isInitialized: true });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/v1/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err) {
      // Token is likely invalid or expired
      localStorage.removeItem('token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },
}));
