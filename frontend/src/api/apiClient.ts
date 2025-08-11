import axios from 'axios';
import { toast } from 'react-toastify';
import env from '../config/env';
import { promptUserToContinueSession } from '../services/sessionManager';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${env.BASE_URL}/api`,
  timeout: 8000, // faster fail for critical requests
  withCredentials: true,
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
    // If still using bearer during migration, attach it; cookies are sent automatically
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Set appropriate Content-Type: if FormData, let browser set boundary; otherwise default to JSON
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    } else {
      if (config.headers && !('Content-Type' in config.headers)) {
        (config.headers as any)['Content-Type'] = 'application/json';
      }
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
      // Do not show session prompt on auth pages or for auth endpoints
      const url: string = originalRequest?.url || '';
      if (isAuthPage() || url.includes('/auth/refresh-token') || url.includes('/auth/login')) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      
      try {
        // Ask the user immediately instead of waiting on multiple timeouts
        const proceed = await Promise.race<boolean>([
          promptUserToContinueSession(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000)), // quick fallback
        ]);
        if (!proceed) {
          throw new Error('User declined session continuation');
        }

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
        // Use cookie-based refresh only; no body token
        const response = await axios.post(
          `${env.BASE_URL}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data as { accessToken?: string };
        // With cookies, no need to persist or attach Authorization; cookies will be sent automatically

        // Retry current
        // Do not override Authorization header; rely on cookie

        // Flush queued requests
        pendingRequests.forEach((cb) => cb(accessToken || ''));
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