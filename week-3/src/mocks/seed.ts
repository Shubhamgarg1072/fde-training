import type { Order, OrderStatus } from '../orders/schemas.ts';
import type { Product } from '../products/schemas.ts';

// A fixed seed and a fixed "today" keep the demo data identical on every machine,
// which the Playwright tests rely on.
const SEED_DATE = new Date('2026-11-20T15:00:00.000Z');
const ORDER_COUNT = 137;
const DAY_MS = 24 * 60 * 60 * 1000;

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seedProducts: Product[] = [
  ['gooseneck-kettle', 'KET-GOOSE', 'Gooseneck kettle', 'kettles', 6400, 18],
  ['electric-kettle', 'KET-ELEC', 'Electric pour-over kettle', 'kettles', 13900, 7],
  ['ceramic-dripper', 'BRW-CONE', 'Ceramic cone dripper', 'brewers', 2800, 42],
  ['flat-bottom-dripper', 'BRW-FLAT', 'Flat-bottom dripper', 'brewers', 3600, 0],
  ['glass-carafe', 'BRW-CARAFE', 'Glass carafe, 600 ml', 'brewers', 3200, 25],
  ['hand-grinder', 'GRD-HAND', 'Hand grinder', 'grinders', 11500, 9],
  ['burr-grinder', 'GRD-BURR', 'Electric burr grinder', 'grinders', 24900, 3],
  ['scale', 'BRW-SCALE', 'Brew scale with timer', 'brewers', 4500, 31],
  ['ethiopia-guji', 'COF-GUJI', 'Ethiopia Guji, 250 g', 'coffee', 1900, 64],
  ['colombia-huila', 'COF-HUILA', 'Colombia Huila, 250 g', 'coffee', 1700, 80],
  ['kenya-nyeri', 'COF-NYERI', 'Kenya Nyeri, 250 g', 'coffee', 2200, 12],
  ['paper-filters', 'BRW-FILTER', 'Paper filters, 100 pack', 'brewers', 800, 150],
].map(([id, sku, name, category, priceCents, stock]) => ({
  id: id as string,
  sku: sku as string,
  name: name as string,
  category: category as Product['category'],
  priceCents: priceCents as number,
  stock: stock as number,
  description: '',
  active: id !== 'flat-bottom-dripper',
  updatedAt: new Date(SEED_DATE.getTime() - 30 * DAY_MS).toISOString(),
}));

const CUSTOMERS = [
  ['Priya Raman', 'Portland', 'OR'],
  ['Tomás Ortega', 'Austin', 'TX'],
  ['Hannah Becker', 'Madison', 'WI'],
  ['Kwame Mensah', 'Brooklyn', 'NY'],
  ['Mei Lin', 'Seattle', 'WA'],
  ['Oliver Grant', 'Denver', 'CO'],
  ['Aisha Khan', 'Chicago', 'IL'],
  ['Lucas Moreau', 'Boston', 'MA'],
  ['Sofia Rossi', 'Philadelphia', 'PA'],
  ['Daniel Kim', 'Oakland', 'CA'],
  ['Grace Okafor', 'Minneapolis', 'MN'],
  ['Elias Lindqvist', 'Burlington', 'VT'],
  ['Nadia Haddad', 'Asheville', 'NC'],
  ['Sam Whitaker', 'Pittsburgh', 'PA'],
  ['Yuki Tanaka', 'Tucson', 'AZ'],
  ['Freya Morgan', 'Raleigh', 'NC'],
] as const;

const STREETS = ['Alder St', 'Maple Ave', 'Division St', 'Hawthorne Blvd', 'Elm St'];
const FLAT_SHIPPING_CENTS = 650;
const FREE_SHIPPING_FROM_CENTS = 6000;

function statusForAge(ageDays: number, roll: number): OrderStatus {
  if (roll < 0.06) return 'cancelled';
  if (ageDays < 1) return roll < 0.5 ? 'pending' : 'paid';
  if (ageDays < 3) return roll < 0.4 ? 'paid' : 'shipped';
  if (ageDays < 7) return roll < 0.7 ? 'shipped' : 'delivered';
  return 'delivered';
}

function emailFor(name: string) {
  const local = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '.');
  return `${local}@example.com`;
}

const HISTORY_PATH: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered'];

export function generateOrders(): Order[] {
  const random = mulberry32(20261120);
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)] as T;

  return Array.from({ length: ORDER_COUNT }, (_, index) => {
    const ageDays = (index / ORDER_COUNT) * 60 + random() * 0.8;
    const createdAt = new Date(SEED_DATE.getTime() - ageDays * DAY_MS);
    const [customerName, city, state] = pick(CUSTOMERS);

    const lineCount = 1 + Math.floor(random() * 3);
    const products = [...seedProducts].sort(() => random() - 0.5).slice(0, lineCount);
    const lines = products.map((product) => ({
      productId: product.id,
      name: product.name,
      quantity: 1 + Math.floor(random() * (product.category === 'coffee' ? 3 : 1.4)),
      unitPriceCents: product.priceCents,
    }));
    const subtotal = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPriceCents,
      0,
    );
    const shippingCents = subtotal >= FREE_SHIPPING_FROM_CENTS ? 0 : FLAT_SHIPPING_CENTS;

    const status = statusForAge(ageDays, random());
    const reached = status === 'cancelled' ? 1 : HISTORY_PATH.indexOf(status) + 1;
    const statusHistory = HISTORY_PATH.slice(0, reached).map((step, stepIndex) => ({
      status: step,
      at: new Date(createdAt.getTime() + stepIndex * 0.9 * DAY_MS).toISOString(),
    }));
    if (status === 'cancelled') {
      statusHistory.push({
        status: 'cancelled',
        at: new Date(createdAt.getTime() + 0.2 * DAY_MS).toISOString(),
      });
    }

    return {
      id: `SP-${String(1000 + ORDER_COUNT - index)}`,
      customerName,
      customerEmail: emailFor(customerName),
      status,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      totalCents: subtotal + shippingCents,
      createdAt: createdAt.toISOString(),
      lines,
      shippingCents,
      shippingAddress: {
        line1: `${String(1 + Math.floor(random() * 120))} ${pick(STREETS)}`,
        city: `${city}, ${state}`,
        postcode: String(10000 + Math.floor(random() * 89999)),
        country: 'United States',
      },
      statusHistory,
    };
  });
}
