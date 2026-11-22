import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './authStore.ts';
import { refreshSession } from '../lib/apiClient.ts';
import { Spinner } from '../ui/Spinner.tsx';

// On first load the access token is gone (it was only in memory), so try the refresh
// cookie before deciding whether to show the login page.
export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (useAuthStore.getState().status !== 'checking') return;
    refreshSession().catch(() => {
      useAuthStore.getState().signOut();
    });
  }, []);

  if (status === 'checking') return <Spinner label="Checking your session" />;
  return children;
}
