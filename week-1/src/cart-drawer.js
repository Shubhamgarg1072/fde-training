import { cart } from './cart-store.js';
import { MAX_QUANTITY, cartTotals } from './cart.js';
import { formatPrice } from './format.js';
import { announce } from './announcer.js';

const openButton = document.querySelector('[data-open-cart]');
const drawer = document.querySelector('#cart-drawer');
const heading = drawer.querySelector('#cart-title');
const list = drawer.querySelector('[data-cart-lines]');
const emptyState = drawer.querySelector('[data-cart-empty]');
const summary = drawer.querySelector('[data-cart-summary]');
const shippingNote = drawer.querySelector('[data-shipping-note]');
const subtotal = drawer.querySelector('[data-subtotal]');
const shipping = drawer.querySelector('[data-shipping]');
const total = drawer.querySelector('[data-total]');
const lineTemplate = document.querySelector('#cart-line-template');

let productsById = new Map();

export function initCartDrawer(products) {
  productsById = new Map(products.map((product) => [product.id, product]));

  openButton.disabled = false;
  openButton.addEventListener('click', () => {
    drawer.showModal();
    heading.focus();
  });
  // Browsers are supposed to restore focus when a modal dialog closes, but older Safari doesn't.
  drawer.addEventListener('close', () => openButton.focus());
  drawer.addEventListener('click', handleDrawerClick);
  list.addEventListener('change', handleQuantityChange);

  cart.subscribe(render);
  render(cart.getItems());
}

function quantityOf(productId) {
  return cart.getItems().find((item) => item.productId === productId)?.quantity ?? 0;
}

function handleDrawerClick(event) {
  // A click on the dialog element itself is a click on the backdrop, since the panel fills it.
  if (event.target === drawer || event.target.closest('[data-close-cart]')) {
    drawer.close();
    return;
  }

  const control = event.target.closest('[data-control]');
  const productId = control?.closest('[data-product-id]')?.dataset.productId;
  if (!productId || control.getAttribute('aria-disabled') === 'true') return;

  if (control.dataset.control === 'increase') {
    cart.setQuantity(productId, quantityOf(productId) + 1);
  } else if (control.dataset.control === 'decrease') {
    cart.setQuantity(productId, quantityOf(productId) - 1);
  } else if (control.dataset.control === 'remove') {
    cart.remove(productId);
    announce(`Removed ${productsById.get(productId).name} from your cart.`);
  }
}

function handleQuantityChange(event) {
  const input = event.target;
  const productId = input.closest('[data-product-id]')?.dataset.productId;
  if (!productId) return;

  if (Number.isNaN(input.valueAsNumber)) {
    input.value = quantityOf(productId);
    return;
  }
  cart.setQuantity(productId, input.valueAsNumber);
}

function render(items) {
  const focusTarget = captureFocus();
  const lines = items.filter((item) => productsById.has(item.productId));
  list.replaceChildren(...lines.map(createLine));
  restoreFocus(focusTarget);

  const totals = cartTotals(items, productsById);
  const isEmpty = lines.length === 0;
  emptyState.hidden = !isEmpty;
  summary.hidden = isEmpty;

  subtotal.textContent = formatPrice(totals.subtotalCents);
  shipping.textContent =
    totals.shippingCents === 0 ? 'Free' : formatPrice(totals.shippingCents);
  total.textContent = formatPrice(totals.totalCents);
  shippingNote.textContent =
    totals.centsUntilFreeShipping > 0
      ? `Add ${formatPrice(totals.centsUntilFreeShipping)} more for free shipping.`
      : 'Your order ships free.';
}

// Lines are rebuilt on every change, so remember which control had focus and put it back.
function captureFocus() {
  const active = document.activeElement;
  const line = active?.closest('[data-product-id]');
  if (!line || !list.contains(line)) return null;
  return {
    productId: line.dataset.productId,
    control: active.dataset.control,
    index: Array.prototype.indexOf.call(list.children, line),
  };
}

function restoreFocus(target) {
  if (!target) return;
  const line = list.querySelector(`[data-product-id="${CSS.escape(target.productId)}"]`);
  if (line) {
    line.querySelector(`[data-control="${target.control}"]`)?.focus();
    return;
  }
  // The line was removed. Move to the line that took its place, or the heading if the cart is empty.
  const neighbour = list.children[Math.min(target.index, list.children.length - 1)];
  (neighbour?.querySelector('[data-control="remove"]') ?? heading).focus();
}

function createLine({ productId, quantity }) {
  const product = productsById.get(productId);
  const line = lineTemplate.content.firstElementChild.cloneNode(true);
  const inputId = `quantity-${productId}`;

  line.dataset.productId = productId;
  line.querySelector('.cart-line__art').style.setProperty('--swatch', product.swatch);
  line.querySelector('.cart-line__name').textContent = product.name;
  line.querySelector('.cart-line__unit-price').textContent =
    `${formatPrice(product.priceCents)} each`;
  line.querySelector('.cart-line__total').textContent = formatPrice(
    product.priceCents * quantity,
  );

  const label = line.querySelector('[data-quantity-label]');
  label.htmlFor = inputId;
  label.textContent = `Quantity of ${product.name}`;

  const input = line.querySelector('[data-control="quantity"]');
  input.id = inputId;
  input.value = quantity;
  input.max = MAX_QUANTITY;

  line.querySelector('[data-decrease-label]').textContent =
    `Decrease quantity of ${product.name}`;
  line.querySelector('[data-increase-label]').textContent =
    `Increase quantity of ${product.name}`;
  line.querySelector('[data-remove-label]').textContent = ` ${product.name} from cart`;
  // aria-disabled instead of disabled so the button keeps focus when the limit is reached.
  line
    .querySelector('[data-control="increase"]')
    .setAttribute('aria-disabled', String(quantity >= MAX_QUANTITY));

  return line;
}
