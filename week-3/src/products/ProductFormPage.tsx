import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { productDetailQuery } from './queries.ts';
import { toProductFormValues, type ProductFormInput } from './schemas.ts';
import { ProductForm } from './ProductForm.tsx';
import { apiErrorStatus } from '../lib/apiError.ts';
import { PageHeading } from '../ui/PageHeading.tsx';
import { Spinner } from '../ui/Spinner.tsx';
import { QueryError } from '../ui/QueryError.tsx';

const EMPTY_PRODUCT: ProductFormInput = {
  name: '',
  sku: '',
  category: '',
  price: Number.NaN,
  stock: 0,
  description: '',
  active: true,
};

export function ProductFormPage() {
  const { productId } = useParams();

  return (
    <div className="page">
      <Link to="/products" className="back-link">
        <span aria-hidden="true">←</span> All products
      </Link>
      {productId ? (
        <EditProduct productId={productId} />
      ) : (
        <>
          <title>New product · Slow Pour Admin</title>
          <PageHeading>New product</PageHeading>
          <ProductForm defaultValues={EMPTY_PRODUCT} />
        </>
      )}
    </div>
  );
}

function EditProduct({ productId }: { productId: string }) {
  const productQuery = useQuery(productDetailQuery(productId));

  if (productQuery.isPending) return <Spinner label="Loading product" />;
  if (productQuery.isError) {
    return apiErrorStatus(productQuery.error) === 404 ? (
      <>
        <title>Product not found · Slow Pour Admin</title>
        <PageHeading>Product not found</PageHeading>
        <p>It may have been removed.</p>
      </>
    ) : (
      <QueryError
        title="This product couldn't be loaded"
        error={productQuery.error}
        onRetry={() => void productQuery.refetch()}
      />
    );
  }

  return (
    <>
      <title>{`Edit ${productQuery.data.name} · Slow Pour Admin`}</title>
      <PageHeading>Edit {productQuery.data.name}</PageHeading>
      <ProductForm
        productId={productId}
        defaultValues={toProductFormValues(productQuery.data)}
      />
    </>
  );
}
