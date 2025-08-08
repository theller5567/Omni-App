import axios from 'axios';
import { toast } from 'react-toastify';
import env from '../config/env';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${env.BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to detect auth pages we should not spam with toasts
const isAuthPage = (): boolean => {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p === '/' || p.startsWith('/accept-invitation');
};

let refreshToastId: string | number | null = null;

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// In-flight refresh control so multiple 401s share one refresh
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        if (isRefreshing) {
          // Queue the request until refresh completes
          return new Promise((resolve) => {
            pendingRequests.push((newToken: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              resolve(apiClient(originalRequest));
            });
          });
        }

        isRefreshing = true;
        // Non-intrusive UX: show one-time notice while refreshing
        if (!isAuthPage()) {
          refreshToastId = toast.info('Refreshing your session…', {
            toastId: 'session-refreshing',
            autoClose: 1500,
            position: 'bottom-center',
          });
        }
        const response = await axios.post(`${env.BASE_URL}/api/auth/refresh-token`, { refreshToken });
        const { accessToken } = response.data as { accessToken: string };
        localStorage.setItem('authToken', accessToken);

        // Retry current
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Flush queued requests
        pendingRequests.forEach((cb) => cb(accessToken));
        pendingRequests = [];
        isRefreshing = false;
        if (refreshToastId && !isAuthPage()) {
          toast.update('session-refreshing', {
            render: 'Session refreshed',
            type: 'success',
            autoClose: 1200,
          });
          refreshToastId = null;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, handle logout + soft redirect to auth page
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        if (!isAuthPage()) {
          toast.error('Session expired. Please sign in again.', { position: 'bottom-center' });
        }
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/' && !path.startsWith('/accept-invitation')) {
            window.location.href = '/';
          }
        }
        // Fail all queued requests
        pendingRequests = [];
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;