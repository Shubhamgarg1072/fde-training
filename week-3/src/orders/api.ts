import { api } from '../lib/apiClient.ts';
import {
  orderPageSchema,
  orderSchema,
  type Order,
  type OrderListParams,
  type OrderPage,
  type OrderStatus,
} from './schemas.ts';

export async function fetchOrders(
  params: OrderListParams,
  signal: AbortSignal,
): Promise<OrderPage> {
  const response = await api.get('/orders', { params, signal });
  return orderPageSchema.parse(response.data);
}

export async function fetchOrder(orderId: string, signal: AbortSignal): Promise<Order> {
  const response = await api.get(`/orders/${encodeURIComponent(orderId)}`, { signal });
  return orderSchema.parse(response.data);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  const response = await api.patch(`/orders/${encodeURIComponent(orderId)}`, { status });
  return orderSchema.parse(response.data);
}
