import { useEffect, useId, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderListQuery } from './queries.ts';
import { useOrderListParams } from './useOrderListParams.ts';
import { OrdersTable } from './OrdersTable.tsx';
import { Pagination } from './Pagination.tsx';
import { STATUS_LABELS } from './statusLabels.ts';
import { ORDER_STATUSES, orderStatusSchema } from './schemas.ts';
import { usePrefsStore } from '../ui/prefsStore.ts';
import { Spinner } from '../ui/Spinner.tsx';
import { QueryError } from '../ui/QueryError.tsx';
import styles from './OrdersPage.module.css';
import { PageHeading } from '../ui/PageHeading.tsx';

const SEARCH_DELAY_MS = 300;

export function OrdersPage() {
  const [params, updateParams] = useOrderListParams();
  const queryClient = useQueryClient();
  const ordersQuery = useQuery(orderListQuery(params));
  const density = usePrefsStore((state) => state.tableDensity);
  const setDensity = usePrefsStore((state) => state.setTableDensity);

  const [searchText, setSearchText] = useState(params.q ?? '');
  const searchTimeout = useRef<number>(undefined);
  const searchId = useId();
  const statusId = useId();

  // Warm the cache for the next page so "Next" feels instant.
  const total = ordersQuery.data?.total ?? 0;
  useEffect(() => {
    if (params.page * params.pageSize < total) {
      // A failed prefetch is harmless; the real request retries and reports it.
      queryClient
        .query(orderListQuery({ ...params, page: params.page + 1 }))
        .catch(() => undefined);
    }
  }, [params, total, queryClient]);

  function handleSearchChange(value: string) {
    setSearchText(value);
    window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      updateParams({ q: value.trim() || undefined });
    }, SEARCH_DELAY_MS);
  }

  const isFiltered = params.q !== undefined || params.status !== undefined;

  return (
    <div className="page">
      <title>Orders · Slow Pour Admin</title>
      <div className="page-header">
        <div>
          <PageHeading>Orders</PageHeading>
          <p>Every order placed in the shop, newest first.</p>
        </div>
      </div>

      <search className={styles.toolbar}>
        <div className={styles.searchField}>
          <label htmlFor={searchId}>Search</label>
          <input
            id={searchId}
            type="search"
            value={searchText}
            placeholder="Order number, name or email"
            onChange={(event) => {
              handleSearchChange(event.target.value);
            }}
          />
        </div>
        <div className={styles.statusField}>
          <label htmlFor={statusId}>Status</label>
          <select
            id={statusId}
            value={params.status ?? ''}
            onChange={(event) => {
              const status = orderStatusSchema.safeParse(event.target.value);
              updateParams({ status: status.success ? status.data : undefined });
            }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={`button ${styles.density}`}
          aria-pressed={density === 'compact'}
          onClick={() => {
            setDensity(density === 'compact' ? 'comfortable' : 'compact');
          }}
        >
          Compact rows
        </button>
      </search>

      {ordersQuery.isPending ? (
        <Spinner label="Loading orders" />
      ) : ordersQuery.isError ? (
        <QueryError
          title="Orders couldn't be loaded"
          error={ordersQuery.error}
          onRetry={() => void ordersQuery.refetch()}
        />
      ) : ordersQuery.data.items.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <h2>No orders match these filters</h2>
          {isFiltered && (
            <button
              type="button"
              className="button"
              onClick={() => {
                setSearchText('');
                updateParams({ q: undefined, status: undefined });
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <OrdersTable
            orders={ordersQuery.data.items}
            sort={params.sort}
            order={params.order}
            onSortChange={(sort, order) => {
              updateParams({ sort, order });
            }}
            density={density}
            isUpdating={ordersQuery.isPlaceholderData}
          />
          <Pagination
            page={params.page}
            pageSize={params.pageSize}
            total={ordersQuery.data.total}
            onPageChange={(page) => {
              updateParams({ page });
            }}
            onPageSizeChange={(pageSize) => {
              updateParams({ pageSize });
            }}
          />
        </div>
      )}
    </div>
  );
}
