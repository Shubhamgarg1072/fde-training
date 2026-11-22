import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FLAT_SHIPPING_CENTS,
  MAX_QUANTITY,
  addItem,
  cartTotals,
  removeItem,
  setQuantity,
} from './cart.js';

const productsById = new Map([
  ['dripper', { id: 'dripper', priceCents: 2800 }],
  ['grinder', { id: 'grinder', priceCents: 11500 }],
]);

describe('addItem', () => {
  it('adds a new line with quantity 1', () => {
    assert.deepEqual(addItem([], 'dripper'), [{ productId: 'dripper', quantity: 1 }]);
  });

  it('increments an existing line instead of duplicating it', () => {
    const items = addItem(addItem([], 'dripper'), 'dripper');
    assert.deepEqual(items, [{ productId: 'dripper', quantity: 2 }]);
  });

  it('does not mutate the input array', () => {
    const items = [{ productId: 'dripper', quantity: 1 }];
    addItem(items, 'dripper');
    assert.equal(items[0].quantity, 1);
  });
});

describe('setQuantity', () => {
  const items = [{ productId: 'dripper', quantity: 2 }];

  it('caps the quantity', () => {
    assert.equal(setQuantity(items, 'dripper', 99)[0].quantity, MAX_QUANTITY);
  });

  it('removes the line at zero or below', () => {
    assert.deepEqual(setQuantity(items, 'dripper', 0), []);
    assert.deepEqual(setQuantity(items, 'dripper', -3), []);
  });

  it('treats NaN from an empty input as a removal', () => {
    assert.deepEqual(setQuantity(items, 'dripper', Number('')), []);
    assert.deepEqual(setQuantity(items, 'dripper', Number.NaN), []);
  });
});

describe('removeItem', () => {
  it('only removes the matching line', () => {
    const items = [
      { productId: 'dripper', quantity: 1 },
      { productId: 'grinder', quantity: 1 },
    ];
    assert.deepEqual(removeItem(items, 'dripper'), [
      { productId: 'grinder', quantity: 1 },
    ]);
  });
});

describe('cartTotals', () => {
  it('charges flat shipping under the threshold', () => {
    const totals = cartTotals([{ productId: 'dripper', quantity: 1 }], productsById);
    assert.equal(totals.subtotalCents, 2800);
    assert.equal(totals.shippingCents, FLAT_SHIPPING_CENTS);
    assert.equal(totals.totalCents, 2800 + FLAT_SHIPPING_CENTS);
    assert.equal(totals.centsUntilFreeShipping, 3200);
  });

  it('ships free at or over the threshold', () => {
    const totals = cartTotals([{ productId: 'grinder', quantity: 1 }], productsById);
    assert.equal(totals.shippingCents, 0);
    assert.equal(totals.centsUntilFreeShipping, 0);
  });

  it('charges nothing for an empty cart', () => {
    assert.equal(cartTotals([], productsById).totalCents, 0);
  });

  it('skips lines whose product no longer exists', () => {
    const totals = cartTotals([{ productId: 'discontinued', quantity: 3 }], productsById);
    assert.equal(totals.count, 0);
    assert.equal(totals.subtotalCents, 0);
  });
});
