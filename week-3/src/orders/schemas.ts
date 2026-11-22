import { z } from 'zod';

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Shared by the UI (which options to offer) and the mock API (which changes to accept).
export const STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const orderSummarySchema = z.object({
  id: z.string(),
  customerName: z.string(),
  customerEmail: z.email(),
  status: orderStatusSchema,
  itemCount: z.number().int().positive(),
  totalCents: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const orderSchema = orderSummarySchema.extend({
  lines: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative(),
    }),
  ),
  shippingAddress: z.object({
    line1: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  shippingCents: z.number().int().nonnegative(),
  statusHistory: z.array(z.object({ status: orderStatusSchema, at: z.iso.datetime() })),
});
export type Order = z.infer<typeof orderSchema>;

export const orderPageSchema = z.object({
  items: z.array(orderSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});
export type OrderPage = z.infer<typeof orderPageSchema>;

export const ORDER_SORT_FIELDS = [
  'createdAt',
  'customerName',
  'status',
  'totalCents',
] as const;
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];
export const PAGE_SIZES = [10, 20, 50] as const;

// Parses URL query strings on both sides. Anything malformed falls back to a default
// instead of throwing, because people edit URLs by hand.
export const orderListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => PAGE_SIZES.some((allowed) => allowed === size))
    .catch(20),
  sort: z.enum(ORDER_SORT_FIELDS).catch('createdAt'),
  order: z.enum(['asc', 'desc']).catch('desc'),
  status: orderStatusSchema.optional().catch(undefined),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => value || undefined)
    .optional()
    .catch(undefined),
});
export type OrderListParams = z.infer<typeof orderListParamsSchema>;
