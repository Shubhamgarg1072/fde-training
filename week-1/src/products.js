const REQUEST_TIMEOUT_MS = 8000;

export async function fetchProducts() {
  const response = await fetch('/products.json', {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Products request failed with ${response.status}`);
  }
  return response.json();
}
