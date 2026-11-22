import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { fetchOrder, fetchOrders } from './api.ts';
import type { OrderListParams } from './schemas.ts';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: OrderListParams) => [...orderKeys.lists(), params] as const,
  detail: (orderId: string) => [...orderKeys.all, 'detail', orderId] as const,
};

export function orderListQuery(params: OrderListParams) {
  return queryOptions({
    queryKey: orderKeys.list(params),
    queryFn: ({ signal }) => fetchOrders(params, signal),
    // Keep the current page on screen while the next one loads, instead of flashing
    // a spinner on every sort or page change.
    placeholderData: keepPreviousData,
  });
}

export function orderDetailQuery(orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
  });
}
