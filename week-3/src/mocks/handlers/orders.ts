import { HttpResponse, http } from 'msw';
import {
  STATUS_TRANSITIONS,
  orderListParamsSchema,
  orderStatusSchema,
  type Order,
  type OrderSummary,
} from '../../orders/schemas.ts';
import { db } from '../db.ts';
import { authenticatedUserId } from './auth.ts';
import { networkDelay } from './networkDelay.ts';

const notSignedIn = () =>
  HttpResponse.json({ message: 'Not signed in.' }, { status: 401 });

function toSummary({
  id,
  customerName,
  customerEmail,
  status,
  itemCount,
  totalCents,
  createdAt,
}: Order): OrderSummary {
  return { id, customerName, customerEmail, status, itemCount, totalCents, createdAt };
}

export const orderHandlers = [
  http.get('/api/orders', async ({ request }) => {
    await networkDelay();
    if (!authenticatedUserId(request)) return notSignedIn();

    const url = new URL(request.url);
    const params = orderListParamsSchema.parse(Object.fromEntries(url.searchParams));
    const query = params.q?.toLowerCase();

    const matching = db
      .orders()
      .filter((order) => !params.status || order.status === params.status)
      .filter(
        (order) =>
          !query ||
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query),
      );

    const direction = params.order === 'asc' ? 1 : -1;
    matching.sort((a, b) => {
      const left = a[params.sort];
      const right = b[params.sort];
      const compared =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right));
      return compared * direction || a.id.localeCompare(b.id);
    });

    const start = (params.page - 1) * params.pageSize;
    return HttpResponse.json({
      items: matching.slice(start, start + params.pageSize).map(toSummary),
      total: matching.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  }),

  http.get('/api/orders/:orderId', async ({ request, params }) => {
    await networkDelay();
    if (!authenticatedUserId(request)) return notSignedIn();

    const order = db.orders().find((candidate) => candidate.id === params.orderId);
    if (!order)
      return HttpResponse.json({ message: 'Order not found.' }, { status: 404 });
    return HttpResponse.json(order);
  }),

  http.patch('/api/orders/:orderId', async ({ request, params }) => {
    await networkDelay();
    if (!authenticatedUserId(request)) return notSignedIn();

    const orders = db.orders();
    const order = orders.find((candidate) => candidate.id === params.orderId);
    if (!order)
      return HttpResponse.json({ message: 'Order not found.' }, { status: 404 });

    const body = (await request.json()) as { status?: unknown };
    const nextStatus = orderStatusSchema.safeParse(body.status);
    if (
      !nextStatus.success ||
      !STATUS_TRANSITIONS[order.status].includes(nextStatus.data)
    ) {
      return HttpResponse.json(
        { message: `A ${order.status} order can't be marked as ${String(body.status)}.` },
        { status: 422 },
      );
    }

    order.status = nextStatus.data;
    order.statusHistory.push({ status: nextStatus.data, at: new Date().toISOString() });
    db.saveOrders(orders);
    return HttpResponse.json(order);
  }),
];
