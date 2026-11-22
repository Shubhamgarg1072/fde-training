import { z } from 'zod';

export const PRODUCT_CATEGORIES = ['kettles', 'brewers', 'grinders', 'coffee'] as const;
export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);

export const CATEGORY_LABELS: Record<z.infer<typeof productCategorySchema>, string> = {
  kettles: 'Kettles',
  brewers: 'Brewers',
  grinders: 'Grinders',
  coffee: 'Coffee',
};

export const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: productCategorySchema,
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  description: z.string(),
  active: z.boolean(),
  updatedAt: z.iso.datetime(),
});
export type Product = z.infer<typeof productSchema>;

export const productInputSchema = productSchema.omit({ id: true, updatedAt: true });
export type ProductInput = z.infer<typeof productInputSchema>;

// The form edits price in dollars. Cents only exist at the API boundary.
export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name needs at least 2 characters')
    .max(80, 'Keep the name under 80 characters'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,20}$/, 'Use 3 to 20 letters, numbers or dashes'),
  category: productCategorySchema.or(z.literal('')).refine((value) => value !== '', {
    message: 'Pick a category',
  }),
  price: z
    .number({ error: 'Enter a price' })
    .positive('Price must be more than zero')
    .max(10_000, 'Price must be under $10,000')
    // 19.99 * 100 is 1998.9999999999998 in floating point, so compare with a tolerance.
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
      message: 'Use at most two decimal places',
    }),
  stock: z
    .number({ error: 'Enter a stock count' })
    .int('Stock must be a whole number')
    .min(0, "Stock can't be negative"),
  description: z.string().trim().max(280, 'Keep the description under 280 characters'),
  active: z.boolean(),
});
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormOutput = z.output<typeof productFormSchema>;

export function toProductInput(values: ProductFormOutput): ProductInput {
  const { price, category, ...rest } = values;
  return {
    ...rest,
    category: productCategorySchema.parse(category),
    priceCents: Math.round(price * 100),
  };
}

export function toProductFormValues(product: Product): ProductFormInput {
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: product.priceCents / 100,
    stock: product.stock,
    description: product.description,
    active: product.active,
  };
}
