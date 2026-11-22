import { queryOptions } from '@tanstack/react-query';
import { fetchProduct, fetchProducts } from './api.ts';

export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  detail: (productId: string) => [...productKeys.all, 'detail', productId] as const,
};

export function productListQuery() {
  return queryOptions({
    queryKey: productKeys.list(),
    queryFn: ({ signal }) => fetchProducts(signal),
  });
}

export function productDetailQuery(productId: string) {
  return queryOptions({
    queryKey: productKeys.detail(productId),
    queryFn: ({ signal }) => fetchProduct(productId, signal),
  });
}
