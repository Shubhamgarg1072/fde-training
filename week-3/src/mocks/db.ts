import { generateOrders, seedProducts } from './seed.ts';
import type { Order } from '../orders/schemas.ts';
import type { Product } from '../products/schemas.ts';

// The mock API keeps its state in localStorage so a page reload behaves like a real
// backend: sessions, edited products and status changes survive.
const PREFIX = 'mock-api:';

function read<T>(key: string, fallback: () => T): T {
  const raw = localStorage.getItem(PREFIX + key);
  if (raw !== null) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Fall through and reseed.
    }
  }
  const value = fallback();
  write(key, value);
  return value;
}

function write(key: string, value: unknown) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export interface RefreshTokenRecord {
  userId: string;
  familyId: string;
  usedAt: number | null;
}

export interface AccessTokenRecord {
  userId: string;
  familyId: string;
  expiresAt: number;
}

interface Sessions {
  refreshTokens: Record<string, RefreshTokenRecord>;
  accessTokens: Record<string, AccessTokenRecord>;
}

export const db = {
  orders: () => read<Order[]>('orders', generateOrders),
  saveOrders: (orders: Order[]) => {
    write('orders', orders);
  },
  products: () => read<Product[]>('products', () => seedProducts),
  saveProducts: (products: Product[]) => {
    write('products', products);
  },
  sessions: () =>
    read<Sessions>('sessions', () => ({ refreshTokens: {}, accessTokens: {} })),
  saveSessions: (sessions: Sessions) => {
    write('sessions', sessions);
  },
};

export function resetMockDb() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PREFIX)) localStorage.removeItem(key);
  }
}
