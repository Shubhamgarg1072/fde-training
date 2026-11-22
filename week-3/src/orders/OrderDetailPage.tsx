import { Link, useLocation, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { orderDetailQuery } from './queries.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { StatusUpdateForm } from './StatusUpdateForm.tsx';
import { STATUS_LABELS } from './statusLabels.ts';
import { formatCents, formatDateTime } from '../lib/format.ts';
import { apiErrorStatus } from '../lib/apiError.ts';
import { Spinner } from '../ui/Spinner.tsx';
import { QueryError } from '../ui/QueryError.tsx';
import styles from './OrderDetailPage.module.css';
import { PageHeading } from '../ui/PageHeading.tsx';

export interface OrderLinkState {
  listSearch?: string;
}

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const listSearch = (useLocation().state as OrderLinkState | null)?.listSearch ?? '';
  const orderQuery = useQuery(orderDetailQuery(orderId));
  const backLink = (
    <Link to={`/orders${listSearch}`} className="back-link">
      <span aria-hidden="true">←</span> All orders
    </Link>
  );

  if (orderQuery.isPending) return <Spinner label="Loading order" />;

  if (orderQuery.isError) {
    return (
      <div className="page">
        {backLink}
        {apiErrorStatus(orderQuery.error) === 404 ? (
          <>
            <title>Order not found · Slow Pour Admin</title>
            <PageHeading>Order not found</PageHeading>
            <p>There's no order with the number {orderId}.</p>
          </>
        ) : (
          <QueryError
            title="This order couldn't be loaded"
            error={orderQuery.error}
            onRetry={() => void orderQuery.refetch()}
          />
        )}
      </div>
    );
  }

  const order = orderQuery.data;
  const subtotal = order.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPriceCents,
    0,
  );

  return (
    <div className="page">
      <title>{`Order ${order.id} · Slow Pour Admin`}</title>
      {backLink}
      <div className="page-header">
        <div>
          <PageHeading className={styles.title}>
            Order {order.id} <StatusBadge status={order.status} />
          </PageHeading>
          <p>Placed {formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className={styles.layout}>
        <section className="card" aria-labelledby="items-heading">
          <h2 id="items-heading" className={styles.cardTitle}>
            Items
          </h2>
          <table className={styles.lines}>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className={styles.numeric}>
                  Qty
                </th>
                <th scope="col" className={styles.numeric}>
                  Price
                </th>
                <th scope="col" className={styles.numeric}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.productId}>
                  <td>{line.name}</td>
                  <td className={styles.numeric}>{line.quantity}</td>
                  <td className={styles.numeric}>{formatCents(line.unitPriceCents)}</td>
                  <td className={styles.numeric}>
                    {formatCents(line.quantity * line.unitPriceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCents(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>
                {order.shippingCents === 0 ? 'Free' : formatCents(order.shippingCents)}
              </dd>
            </div>
            <div className={styles.grandTotal}>
              <dt>Total</dt>
              <dd>{formatCents(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.sideColumn}>
          <section className="card" aria-labelledby="status-heading">
            <h2 id="status-heading" className={styles.cardTitle}>
              Status
            </h2>
            <div className={styles.cardBody}>
              <StatusUpdateForm order={order} />
              <ol className={styles.history}>
                {order.statusHistory.toReversed().map((entry) => (
                  <li key={`${entry.status}-${entry.at}`}>
                    <span>{STATUS_LABELS[entry.status]}</span>
                    <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="card" aria-labelledby="customer-heading">
            <h2 id="customer-heading" className={styles.cardTitle}>
              Customer
            </h2>
            <div className={styles.cardBody}>
              <p>{order.customerName}</p>
              <p>
                <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
              </p>
              <address className={styles.address}>
                {order.shippingAddress.line1}
                <br />
                {order.shippingAddress.city} {order.shippingAddress.postcode}
                <br />
                {order.shippingAddress.country}
              </address>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
