import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from './authStore.ts';

export interface LoginLocationState {
  from?: string;
  expired?: boolean;
}

export function RequireAuth() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status !== 'signedIn') {
    const state: LoginLocationState = {
      from: `${location.pathname}${location.search}`,
      expired: status === 'expired',
    };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
