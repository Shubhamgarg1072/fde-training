import { generateOrders, seedProducts } from './seed.ts';
import { orderSchema } from '../orders/schemas.ts';
import { productSchema } from '../products/schemas.ts';

describe('seed data', () => {
  it('matches the API schemas the app parses with', () => {
    for (const order of generateOrders()) orderSchema.parse(order);
    for (const product of seedProducts) productSchema.parse(product);
  });

  it('is the same on every run', () => {
    expect(generateOrders()).toEqual(generateOrders());
  });

  it('has unique order ids', () => {
    const ids = generateOrders().map((order) => order.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
