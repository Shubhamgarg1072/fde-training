import { Link, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { productListQuery } from './queries.ts';
import { CATEGORY_LABELS } from './schemas.ts';
import { formatCents } from '../lib/format.ts';
import { PageHeading } from '../ui/PageHeading.tsx';
import { Spinner } from '../ui/Spinner.tsx';
import { QueryError } from '../ui/QueryError.tsx';
import styles from './ProductsPage.module.css';

export interface ProductsLocationState {
  savedName?: string;
}

export function ProductsPage() {
  const productsQuery = useQuery(productListQuery());
  const savedName = (useLocation().state as ProductsLocationState | null)?.savedName;

  return (
    <div className="page">
      <title>Products · Slow Pour Admin</title>
      <div className="page-header">
        <div>
          <PageHeading>Products</PageHeading>
          <p>What the shop sells, with prices and stock.</p>
        </div>
        <Link to="/products/new" className="button button--primary">
          New product
        </Link>
      </div>

      <div role="status">
        {savedName && <p className="alert alert--info">Saved {savedName}.</p>}
      </div>

      {productsQuery.isPending ? (
        <Spinner label="Loading products" />
      ) : productsQuery.isError ? (
        <QueryError
          title="Products couldn't be loaded"
          error={productsQuery.error}
          onRetry={() => void productsQuery.refetch()}
        />
      ) : (
        <div className={`card ${styles.scroller}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">SKU</th>
                <th scope="col">Category</th>
                <th scope="col" className={styles.numeric}>
                  Price
                </th>
                <th scope="col" className={styles.numeric}>
                  Stock
                </th>
                <th scope="col">In shop</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.data.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link to={`/products/${product.id}/edit`}>{product.name}</Link>
                  </td>
                  <td className={styles.sku}>{product.sku}</td>
                  <td>{CATEGORY_LABELS[product.category]}</td>
                  <td className={styles.numeric}>{formatCents(product.priceCents)}</td>
                  <td className={styles.numeric}>
                    {product.stock === 0 ? (
                      <span className={styles.outOfStock}>Out of stock</span>
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td>{product.active ? 'Listed' : 'Hidden'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
