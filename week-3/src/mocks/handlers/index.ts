import { authHandlers } from './auth.ts';
import { orderHandlers } from './orders.ts';
import { productHandlers } from './products.ts';

export const handlers = [...authHandlers, ...orderHandlers, ...productHandlers];
