import axios from 'axios';
import { useAuthStore } from '../state/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the access token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                if (!refreshToken) {
                    // No refresh token, logout
                    useAuthStore.getState().logout();
                    return Promise.reject(error);
                }

                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;

                // Update store with new token
                useAuthStore.getState().setToken(accessToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
