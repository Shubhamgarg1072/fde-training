import { api } from '../lib/apiClient.ts';
import { sessionSchema, type Credentials, type Session } from './schemas.ts';

export async function login(credentials: Credentials): Promise<Session> {
  const response = await api.post('/auth/login', credentials);
  return sessionSchema.parse(response.data);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
