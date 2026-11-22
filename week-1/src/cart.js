export const MAX_QUANTITY = 10;
export const FREE_SHIPPING_THRESHOLD_CENTS = 6000;
export const FLAT_SHIPPING_CENTS = 650;

export function addItem(items, productId) {
  const existing = items.find((item) => item.productId === productId);
  if (!existing) return [...items, { productId, quantity: 1 }];
  return setQuantity(items, productId, existing.quantity + 1);
}

export function setQuantity(items, productId, quantity) {
  if (!Number.isFinite(quantity) || quantity < 1) return removeItem(items, productId);
  const clamped = Math.min(Math.floor(quantity), MAX_QUANTITY);
  return items.map((item) =>
    item.productId === productId ? { ...item, quantity: clamped } : item,
  );
}

export function removeItem(items, productId) {
  return items.filter((item) => item.productId !== productId);
}

export function cartTotals(items, productsById) {
  let count = 0;
  let subtotalCents = 0;
  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) continue;
    count += item.quantity;
    subtotalCents += product.priceCents * item.quantity;
  }

  const qualifiesForFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const shippingCents = count === 0 || qualifiesForFreeShipping ? 0 : FLAT_SHIPPING_CENTS;
  return {
    count,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    centsUntilFreeShipping: Math.max(FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents, 0),
  };
}
