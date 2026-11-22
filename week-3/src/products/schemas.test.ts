import { productFormSchema, toProductInput } from './schemas.ts';

const valid = {
  name: 'Hand grinder',
  sku: 'grd-hand-01',
  category: 'grinders',
  price: 115,
  stock: 12,
  description: 'Steel conical burrs.',
  active: true,
} as const;

describe('productFormSchema', () => {
  it('normalises the SKU to upper case', () => {
    expect(productFormSchema.parse(valid).sku).toBe('GRD-HAND-01');
  });

  it.each([19.99, 0.1, 1234.56])('accepts %s as a price', (price) => {
    expect(productFormSchema.safeParse({ ...valid, price }).success).toBe(true);
  });

  it('rejects a third decimal place', () => {
    const result = productFormSchema.safeParse({ ...valid, price: 19.999 });
    expect(result.error?.issues[0]?.message).toBe('Use at most two decimal places');
  });

  it('reports an empty number input (NaN) as missing', () => {
    const result = productFormSchema.safeParse({ ...valid, price: Number.NaN });
    expect(result.error?.issues[0]?.message).toBe('Enter a price');
  });

  it('requires a category', () => {
    const result = productFormSchema.safeParse({ ...valid, category: '' });
    expect(result.error?.issues[0]?.message).toBe('Pick a category');
  });
});

describe('toProductInput', () => {
  it('converts dollars to integer cents without float drift', () => {
    const input = toProductInput(productFormSchema.parse({ ...valid, price: 19.99 }));
    expect(input.priceCents).toBe(1999);
  });
});
