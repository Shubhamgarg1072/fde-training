import { z } from 'zod';
import { api } from '../lib/apiClient.ts';
import { productSchema, type Product, type ProductInput } from './schemas.ts';

export async function fetchProducts(signal: AbortSignal): Promise<Product[]> {
  const response = await api.get('/products', { signal });
  return z.array(productSchema).parse(response.data);
}

export async function fetchProduct(
  productId: string,
  signal: AbortSignal,
): Promise<Product> {
  const response = await api.get(`/products/${encodeURIComponent(productId)}`, {
    signal,
  });
  return productSchema.parse(response.data);
}

export async function saveProduct(productId: string | undefined, input: ProductInput) {
  const response = productId
    ? await api.put(`/products/${encodeURIComponent(productId)}`, input)
    : await api.post('/products', input);
  return productSchema.parse(response.data);
}
