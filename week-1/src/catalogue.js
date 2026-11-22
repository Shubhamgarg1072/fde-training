import { formatPrice } from './format.js';

export const CATEGORY_LABELS = {
  kettles: 'Kettles',
  brewers: 'Brewers',
  grinders: 'Grinders',
  coffee: 'Coffee',
};

const grid = document.querySelector('[data-product-grid]');
const status = document.querySelector('[data-catalogue-status]');
const cardTemplate = document.querySelector('#product-card-template');
const controls = document.querySelector('[data-catalogue-controls]');

export function initFilterControls(filters, onChange) {
  controls.elements.category.value = filters.category;
  controls.elements.sort.value = filters.sort;

  controls.addEventListener('change', () => {
    onChange({
      category: controls.elements.category.value,
      sort: controls.elements.sort.value,
    });
  });
  controls.addEventListener('submit', (event) => event.preventDefault());
}

export function renderLoading() {
  grid.setAttribute('aria-busy', 'true');
  status.textContent = 'Loading products…';
  grid.replaceChildren(
    ...Array.from({ length: 6 }, () => {
      const placeholder = document.createElement('li');
      placeholder.className = 'product-card product-card--placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      return placeholder;
    }),
  );
}

export function renderLoadError(onRetry) {
  grid.setAttribute('aria-busy', 'false');
  grid.replaceChildren();

  const message = document.createElement('p');
  message.textContent = "We couldn't load the shop. Check your connection and try again.";
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button';
  retry.textContent = 'Try again';
  retry.addEventListener('click', onRetry, { once: true });

  status.replaceChildren(message, retry);
  retry.focus();
}

export function renderProducts(products) {
  grid.setAttribute('aria-busy', 'false');
  status.textContent =
    products.length === 0
      ? 'Nothing in this category right now.'
      : `${products.length} ${products.length === 1 ? 'product' : 'products'}`;
  grid.replaceChildren(...products.map(createProductCard));
}

function createProductCard(product) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector('.product-card__art').style.setProperty('--swatch', product.swatch);
  card.querySelector('.product-card__monogram').textContent = product.monogram;
  card.querySelector('.product-card__category').textContent =
    CATEGORY_LABELS[product.category] ?? product.category;
  card.querySelector('.product-card__name').textContent = product.name;
  card.querySelector('.product-card__description').textContent = product.description;
  card.querySelector('.product-card__price').textContent = formatPrice(
    product.priceCents,
  );
  card.querySelector('[data-add-to-cart]').dataset.productId = product.id;
  card.querySelector('[data-product-label]').textContent = ` ${product.name} to cart`;
  return card;
}
