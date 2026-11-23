import './styles.css';
import { fetchProducts } from './products.js';
import {
  CATEGORY_LABELS,
  initFilterControls,
  renderLoadError,
  renderLoading,
  renderProducts,
  syncCardQuantities,
} from './catalogue.js';
import {
  applyFilters,
  readFiltersFromUrl,
  writeFiltersToUrl,
} from './catalogue-filters.js';
import { cart } from './cart-store.js';
import { initCartDrawer } from './cart-drawer.js';
import { announce } from './announcer.js';

const cartCount = document.querySelector('[data-cart-count]');
const productGrid = document.querySelector('[data-product-grid]');

function renderCartCount(items) {
  cartCount.textContent = items.reduce((sum, item) => sum + item.quantity, 0);
}

async function loadCatalogue() {
  renderLoading();
  let products;
  try {
    products = await fetchProducts();
  } catch (error) {
    console.error(error);
    renderLoadError(loadCatalogue);
    return;
  }

  cart.retainOnly(products.map((product) => product.id));
  initCartDrawer(products);

  const filters = readFiltersFromUrl(Object.keys(CATEGORY_LABELS));

  initFilterControls(filters, (nextFilters) => {
    writeFiltersToUrl(nextFilters);
    renderProducts(applyFilters(products, nextFilters));
    syncCardQuantities(cart.getItems());
  });
  renderProducts(applyFilters(products, filters));
  syncCardQuantities(cart.getItems());
  cart.subscribe(syncCardQuantities);
}

function cartQuantityOf(productId) {
  return cart.getItems().find((item) => item.productId === productId)?.quantity ?? 0;
}

function cartItemCount() {
  return cart.getItems().reduce((sum, item) => sum + item.quantity, 0);
}

// Adding swaps the Add button for the stepper (and removing the last one swaps it back),
// so focus moves to the control that replaced the one that was clicked.
productGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.product-card[data-product-id]');
  if (!card) return;
  const { productId } = card.dataset;
  const name = card.querySelector('.product-card__name').textContent;

  if (event.target.closest('[data-add-to-cart]')) {
    cart.add(productId);
    card.querySelector('[data-card-step="1"]').focus();
    const count = cartItemCount();
    announce(`Added ${name}. ${count} ${count === 1 ? 'item' : 'items'} in your cart.`);
    return;
  }

  const step = event.target.closest('[data-card-step]');
  if (!step || step.getAttribute('aria-disabled') === 'true') return;

  const quantity = cartQuantityOf(productId) + Number(step.dataset.cardStep);
  cart.setQuantity(productId, quantity);
  if (quantity < 1) {
    card.querySelector('[data-add-to-cart]').focus();
    announce(`Removed ${name} from your cart.`);
  } else {
    announce(`${quantity} ${name} in your cart.`);
  }
});

cart.subscribe(renderCartCount);
renderCartCount(cart.getItems());
loadCatalogue();
