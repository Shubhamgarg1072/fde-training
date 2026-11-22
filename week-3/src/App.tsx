import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { AuthGate } from './auth/AuthGate.tsx';
import { queryClient } from './app/queryClient.ts';
import { router } from './app/router.tsx';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </QueryClientProvider>
  );
}
