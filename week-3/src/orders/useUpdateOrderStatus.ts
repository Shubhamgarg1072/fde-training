import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus } from './api.ts';
import { orderKeys } from './queries.ts';
import type { Order, OrderStatus } from './schemas.ts';

export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();
  const detailKey = orderKeys.detail(orderId);

  return useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),

    // Show the new status straight away. If the server rejects it, put back exactly
    // what was there before.
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Order>(detailKey);
      queryClient.setQueryData<Order>(detailKey, (order) =>
        order
          ? {
              ...order,
              status,
              statusHistory: [
                ...order.statusHistory,
                { status, at: new Date().toISOString() },
              ],
            }
          : order,
      );
      return { previous };
    },

    onError: (_error, _status, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },

    // Lists show status too, so refetch everything under "orders", not just this one.
    onSettled: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
