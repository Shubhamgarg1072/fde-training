import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/authStore.ts';
import { apiErrorStatus } from '../lib/apiError.ts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a 404 or a validation error won't change the answer.
      retry: (failureCount, error) => {
        const status = apiErrorStatus(error);
        if (status !== null && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

// Drop cached data as soon as the session ends, so the next person to sign in on this
// browser never sees the previous user's orders, even for a frame.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'signedIn' && state.status !== 'signedIn') queryClient.clear();
});
