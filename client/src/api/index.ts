import axios from 'axios';
import {
  Configuration,
  AppsApi,
  AuthenticationApi,
  VersionsApi,
  HealthApi,
} from './generated';

// Re-export types from generated API
export type {
  App,
  CreateAppRequest,
  UpdateAppRequest,
  DeleteAppResponse,
  LoginRequest,
  LoginResponse,
  Version,
  VersionFile,
  UploadVersionResponse,
  SetActiveVersionRequest,
  LatestVersion,
  MessageResponse,
  ModelError,
} from './generated';

// Create axios instance with interceptors
const axiosInstance = axios.create();

// Add a request interceptor to attach the token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error details from API error responses
    if (error.response?.data?.code) {
      error.message = error.response.data.message;
      error.code = error.response.data.code;
      error.details = error.response.data.details;
    }
    return Promise.reject(error);
  }
);

// Create configuration with dynamic access token
const createConfiguration = () => {
  return new Configuration({
    basePath: '/api/v1',
    accessToken: () => localStorage.getItem('token') || '',
  });
};

// API instances - lazy initialization to ensure fresh config
let _appsApi: AppsApi | null = null;
let _authApi: AuthenticationApi | null = null;
let _versionsApi: VersionsApi | null = null;
let _healthApi: HealthApi | null = null;

export const appsApi = (): AppsApi => {
  if (!_appsApi) {
    _appsApi = new AppsApi(createConfiguration(), undefined, axiosInstance);
  }
  return _appsApi;
};

export const authApi = (): AuthenticationApi => {
  if (!_authApi) {
    _authApi = new AuthenticationApi(createConfiguration(), undefined, axiosInstance);
  }
  return _authApi;
};

export const versionsApi = (): VersionsApi => {
  if (!_versionsApi) {
    _versionsApi = new VersionsApi(createConfiguration(), undefined, axiosInstance);
  }
  return _versionsApi;
};

export const healthApi = (): HealthApi => {
  if (!_healthApi) {
    _healthApi = new HealthApi(createConfiguration(), undefined, axiosInstance);
  }
  return _healthApi;
};

// Helper to get error message from API errors
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.message) {
      return err.message;
    }
  }
  return 'An unexpected error occurred';
}

// Export axios instance for custom requests (e.g., file uploads with progress)
export { axiosInstance };
