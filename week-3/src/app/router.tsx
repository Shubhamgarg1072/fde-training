import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAuth } from '../auth/RequireAuth.tsx';
import { LoginPage } from '../auth/LoginPage.tsx';
import { AppLayout } from './AppLayout.tsx';
import { RouteError } from './RouteError.tsx';
import { NotFoundPage } from './NotFoundPage.tsx';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/orders" replace /> },
          {
            path: 'orders',
            lazy: async () => ({
              Component: (await import('../orders/OrdersPage.tsx')).OrdersPage,
            }),
          },
          {
            path: 'orders/:orderId',
            lazy: async () => ({
              Component: (await import('../orders/OrderDetailPage.tsx')).OrderDetailPage,
            }),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
