import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../auth/authStore.ts';
import { sessionSchema, type Session } from '../auth/schemas.ts';

export const api = axios.create({ baseURL: '/api', timeout: 10_000 });

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshInFlight: Promise<Session> | null = null;

// Single-flight: when several requests fail with 401 together, they all wait on one
// refresh. Refresh tokens rotate, so a second parallel refresh would present a token
// the server has already retired and get the whole session revoked.
export function refreshSession(): Promise<Session> {
  refreshInFlight ??= api
    .post('/auth/refresh')
    .then((response) => {
      const session = sessionSchema.parse(response.data);
      useAuthStore.getState().signIn(session);
      return session;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  retriedAfterRefresh?: boolean;
}

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!isAxiosError(error) || error.response?.status !== 401) throw error;

  const config = error.config as RetriableRequestConfig | undefined;
  const isAuthEndpoint = config?.url?.startsWith('/auth/') ?? false;
  if (!config || config.retriedAfterRefresh || isAuthEndpoint) throw error;

  config.retriedAfterRefresh = true;
  try {
    await refreshSession();
  } catch {
    useAuthStore.getState().signOut('expired');
    throw error;
  }
  return api(config);
});
