import axios from 'axios';

let accessToken = ''; // Store access token in memory

const refreshToken = localStorage.getItem('refreshToken');

const apiClient = axios.create({
  baseURL: 'http://localhost:5002/api',
});

apiClient.interceptors.request.use(
  (config) => {
    if (!config.headers) {
        config.headers = {}; // Ensure headers is defined
      }
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newAccessToken = await renewAccessToken();
      if (newAccessToken) {
        accessToken = newAccessToken;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

const renewAccessToken = async () => {
  try {
    const response = await axios.post('http://localhost:5002/api/auth/refresh', { token: refreshToken });
    const newAccessToken = (response.data as { accessToken: string }).accessToken;
    return newAccessToken;
  } catch (error) {
    console.error('Failed to refresh access token', error);
    return null;
  }
};

export default apiClient;