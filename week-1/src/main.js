import './styles.css';
import { fetchProducts } from './products.js';
import {
  CATEGORY_LABELS,
  renderFilterControls,
  renderLoadError,
  renderLoading,
  renderProducts,
} from './catalogue.js';
import {
  applyFilters,
  readFiltersFromUrl,
  writeFiltersToUrl,
} from './catalogue-filters.js';
import { cart } from './cart-store.js';
import { initCartDrawer } from './cart-drawer.js';

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

  const categories = Object.keys(CATEGORY_LABELS).filter((category) =>
    products.some((product) => product.category === category),
  );
  const filters = readFiltersFromUrl(categories);

  renderFilterControls(categories, filters, (nextFilters) => {
    writeFiltersToUrl(nextFilters);
    renderProducts(applyFilters(products, nextFilters));
  });
  renderProducts(applyFilters(products, filters));
}

productGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-to-cart]');
  if (button) cart.add(button.dataset.productId);
});

cart.subscribe(renderCartCount);
renderCartCount(cart.getItems());
loadCatalogue();
