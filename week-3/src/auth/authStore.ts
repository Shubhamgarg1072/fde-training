import { create } from 'zustand';
import type { Session, User } from './schemas.ts';

export type AuthStatus = 'checking' | 'signedIn' | 'signedOut' | 'expired';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: User | null;
  signIn: (session: Session) => void;
  signOut: (reason?: 'expired') => void;
}

// Deliberately not persisted. The access token lives in memory only; after a reload
// the session is restored through the refresh cookie (see AuthGate).
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'checking',
  accessToken: null,
  user: null,
  signIn: ({ accessToken, user }) => {
    set({ status: 'signedIn', accessToken, user });
  },
  signOut: (reason) => {
    set({ status: reason ?? 'signedOut', accessToken: null, user: null });
  },
}));
