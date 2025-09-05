import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp
    config.metadata = { startTime: new Date().getTime() };

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration =
        new Date().getTime() - response.config.metadata.startTime;
      console.log(`✅ API Response: ${response.status} (${duration}ms)`);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle common error responses
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('❌ Forbidden: Insufficient permissions');
          break;
        case 404:
          console.error('❌ Not Found: Resource not found');
          break;
        case 422:
          console.error('❌ Validation Error:', data);
          break;
        case 500:
          console.error('❌ Server Error: Internal server error');
          break;
        default:
          console.error(`❌ API Error: ${status}`, data);
      }
    } else if (error.request) {
      console.error('❌ Network Error: No response received');
    } else {
      console.error('❌ Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // GET request
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  // POST request
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  // Upload file
  upload: async <T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }

    const response = await apiClient.post<T>(url, formData, config);
    return response.data;
  },
};

// Export the axios instance for advanced usage
export { apiClient };
export default api;

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
