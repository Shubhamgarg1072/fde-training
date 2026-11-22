const SORTERS = {
  featured: () => 0,
  'price-asc': (a, b) => a.priceCents - b.priceCents,
  'price-desc': (a, b) => b.priceCents - a.priceCents,
  name: (a, b) => a.name.localeCompare(b.name),
};

export function readFiltersFromUrl(validCategories) {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const sort = params.get('sort');
  return {
    category: validCategories.includes(category) ? category : 'all',
    sort: sort in SORTERS ? sort : 'featured',
  };
}

export function writeFiltersToUrl({ category, sort }) {
  const params = new URLSearchParams(window.location.search);
  setOrDelete(params, 'category', category, 'all');
  setOrDelete(params, 'sort', sort, 'featured');
  const query = params.toString();
  // replaceState rather than pushState: changing a filter shouldn't fill the back button history.
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}

function setOrDelete(params, key, value, defaultValue) {
  if (value === defaultValue) params.delete(key);
  else params.set(key, value);
}

export function applyFilters(products, { category, sort }) {
  const visible =
    category === 'all'
      ? products
      : products.filter((product) => product.category === category);
  // toSorted is stable, so "featured" keeps the order from the JSON file.
  return visible.toSorted(SORTERS[sort]);
}
