import { HttpResponse, http } from 'msw';
import { productInputSchema, type Product } from '../../products/schemas.ts';
import { db } from '../db.ts';
import { authenticatedUserId } from './auth.ts';
import { networkDelay } from './networkDelay.ts';

const notSignedIn = () =>
  HttpResponse.json({ message: 'Not signed in.' }, { status: 401 });

function validate(body: unknown, products: Product[], currentId?: string) {
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    );
    return {
      error: HttpResponse.json(
        { message: 'Some fields need fixing.', fieldErrors },
        { status: 422 },
      ),
    };
  }
  const duplicate = products.find(
    (product) => product.sku === parsed.data.sku && product.id !== currentId,
  );
  if (duplicate) {
    return {
      error: HttpResponse.json(
        {
          message: 'That SKU is already in use.',
          fieldErrors: { sku: `Already used by ${duplicate.name}` },
        },
        { status: 409 },
      ),
    };
  }
  return { data: parsed.data };
}

export const productHandlers = [
  http.get('/api/products', async ({ request }) => {
    await networkDelay();
    if (!authenticatedUserId(request)) return notSignedIn();
    return HttpResponse.json(
      db.products().toSorted((a, b) => a.name.localeCompare(b.name)),
    );
  }),

  http.get('/api/products/:productId', async ({ request, params }) => {
    await networkDelay();
    if (!authenticatedUserId(request)) return notSignedIn();
    const product = db.products().find((candidate) => candidate.id === params.productId);
    if (!product)
      return HttpResponse.json({ message: 'Product not found.' }, { status: 404 });
    return HttpResponse.json(product);
  }),

  http.post('/api/products', async ({ request }) => {
    await networkDelay();
    if (!authenticatedUserId(request)) return notSignedIn();

    const products = db.products();
    const result = validate(await request.json(), products);
    if (result.error) return result.error;

    const product: Product = {
      ...result.data,
      id: result.data.sku.toLowerCase(),
      updatedAt: new Date().toISOString(),
    };
    db.saveProducts([...products, product]);
    return HttpResponse.json(product, { status: 201 });
  }),

  http.put('/api/products/:productId', async ({ request, params }) => {
    await networkDelay();
    if (!authenticatedUserId(request)) return notSignedIn();

    const products = db.products();
    const index = products.findIndex((candidate) => candidate.id === params.productId);
    if (index === -1) {
      return HttpResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    const result = validate(await request.json(), products, String(params.productId));
    if (result.error) return result.error;

    const product: Product = {
      ...result.data,
      id: String(params.productId),
      updatedAt: new Date().toISOString(),
    };
    products[index] = product;
    db.saveProducts(products);
    return HttpResponse.json(product);
  }),
];
