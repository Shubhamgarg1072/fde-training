import './styles.css';
import { fetchProducts } from './products.js';
import { renderLoadError, renderLoading, renderProducts } from './catalogue.js';

async function loadCatalogue() {
  renderLoading();
  try {
    const products = await fetchProducts();
    renderProducts(products);
  } catch (error) {
    console.error(error);
    renderLoadError(loadCatalogue);
  }
}

loadCatalogue();
