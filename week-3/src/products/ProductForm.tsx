import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useBlocker, useNavigate } from 'react-router';
import { saveProduct } from './api.ts';
import { productKeys } from './queries.ts';
import {
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  productFormSchema,
  toProductInput,
  type ProductFormInput,
  type ProductFormOutput,
} from './schemas.ts';
import type { ProductsLocationState } from './ProductsPage.tsx';
import { apiErrorBody } from '../lib/apiError.ts';
import { FormField } from '../ui/FormField.tsx';
import { TextField } from '../ui/TextField.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import styles from './ProductForm.module.css';

const FORM_FIELDS = [
  'name',
  'sku',
  'category',
  'price',
  'stock',
  'description',
  'active',
] as const;
type FormFieldName = (typeof FORM_FIELDS)[number];

function isFormField(name: string): name is FormFieldName {
  return FORM_FIELDS.some((field) => field === name);
}

interface ProductFormProps {
  productId?: string | undefined;
  defaultValues: ProductFormInput;
}

export function ProductForm({ productId, defaultValues }: ProductFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const savedSuccessfully = useRef(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormOutput) =>
      saveProduct(productId, toProductInput(values)),
    onSuccess: async (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      await queryClient.invalidateQueries({ queryKey: productKeys.list() });
      savedSuccessfully.current = true;
      const state: ProductsLocationState = { savedName: product.name };
      await navigate('/products', { state });
    },
    onError: (error) => {
      const body = apiErrorBody(error);
      const fieldErrors = Object.entries(body?.fieldErrors ?? {});
      // Server-side rules (like a unique SKU) land on the field they belong to, the
      // same way client-side validation errors do.
      for (const [field, message] of fieldErrors) {
        if (isFormField(field))
          setError(field, { type: 'server', message }, { shouldFocus: true });
      }
      if (fieldErrors.length === 0) {
        setError('root.server', {
          message: body?.message ?? "The product couldn't be saved. Try again.",
        });
      }
    },
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !savedSuccessfully.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
    };
  }, [isDirty]);

  return (
    <>
      <form
        className={`card ${styles.form}`}
        noValidate
        onSubmit={(event) => {
          void handleSubmit((values) => {
            saveMutation.mutate(values);
          })(event);
        }}
      >
        {errors.root?.server && (
          <p className="alert" role="alert">
            {errors.root.server.message}
          </p>
        )}

        <div className={styles.grid}>
          <TextField label="Name" error={errors.name?.message} {...register('name')} />
          <TextField
            label="SKU"
            hint="Letters, numbers and dashes. Must be unique."
            autoCapitalize="characters"
            error={errors.sku?.message}
            {...register('sku')}
          />
          <FormField label="Category" error={errors.category?.message}>
            {(control) => (
              <select {...control} {...register('category')}>
                <option value="">Choose a category</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <TextField
            label="Price (USD)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true })}
          />
          <TextField
            label="Stock"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            error={errors.stock?.message}
            {...register('stock', { valueAsNumber: true })}
          />
        </div>

        <FormField
          label="Description"
          hint="Shown on the product page. Up to 280 characters."
          error={errors.description?.message}
        >
          {(control) => <textarea rows={4} {...control} {...register('description')} />}
        </FormField>

        <label className={styles.checkbox}>
          <input type="checkbox" {...register('active')} />
          List this product in the shop
        </label>

        <div className={styles.actions}>
          <button
            type="submit"
            className="button button--primary"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? 'Saving…'
              : productId
                ? 'Save changes'
                : 'Create product'}
          </button>
          <Link to="/products" className="button">
            Cancel
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        message="You've edited this product. If you leave now, those changes are lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </>
  );
}
