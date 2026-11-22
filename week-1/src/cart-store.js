import { addItem, removeItem, setQuantity } from './cart.js';

const STORAGE_KEY = 'slow-pour:cart';
const listeners = new Set();
let items = readStoredItems();

function readStoredItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

function isCartItem(value) {
  return (
    typeof value?.productId === 'string' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

function commit(nextItems) {
  items = nextItems;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be full or disabled (Safari private mode). The cart still works for this visit.
  }
  notify();
}

function notify() {
  for (const listener of listeners) listener(items);
}

// Keeps the cart in step when the same shop is open in another tab.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  items = readStoredItems();
  notify();
});

export const cart = {
  getItems: () => items,
  add: (productId) => commit(addItem(items, productId)),
  setQuantity: (productId, quantity) => commit(setQuantity(items, productId, quantity)),
  remove: (productId) => commit(removeItem(items, productId)),
  retainOnly(productIds) {
    const known = new Set(productIds);
    const kept = items.filter((item) => known.has(item.productId));
    if (kept.length !== items.length) commit(kept);
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
