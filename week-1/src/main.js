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

loadCatalogue();
