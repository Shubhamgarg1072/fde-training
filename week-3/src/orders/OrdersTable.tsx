import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { Link, useLocation } from 'react-router';
import type { OrderLinkState } from './OrderDetailPage.tsx';
import { StatusBadge } from './StatusBadge.tsx';
import { ORDER_SORT_FIELDS, type OrderSortField, type OrderSummary } from './schemas.ts';
import { formatCents, formatDateTime } from '../lib/format.ts';
import type { TableDensity } from '../ui/prefsStore.ts';
import styles from './OrdersTable.module.css';

// Carries the list's query string along so "All orders" on the detail page returns to
// the same filters, sort and page.
function OrderLink({ orderId }: { orderId: string }) {
  const { search } = useLocation();
  const state: OrderLinkState = { listSearch: search };
  return (
    <Link to={`/orders/${orderId}`} state={state}>
      {orderId}
    </Link>
  );
}

const column = createColumnHelper<OrderSummary>();

const columns = [
  column.accessor('id', {
    header: 'Order',
    enableSorting: false,
    cell: (info) => <OrderLink orderId={info.getValue()} />,
  }),
  column.accessor('customerName', {
    header: 'Customer',
    cell: (info) => (
      <span className={styles.customer}>
        {info.getValue()}
        <span className={styles.email}>{info.row.original.customerEmail}</span>
      </span>
    ),
  }),
  column.accessor('createdAt', {
    header: 'Placed',
    sortDescFirst: true,
    cell: (info) => formatDateTime(info.getValue()),
  }),
  column.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  column.accessor('itemCount', {
    header: 'Items',
    enableSorting: false,
    meta: { numeric: true },
  }),
  column.accessor('totalCents', {
    header: 'Total',
    sortDescFirst: true,
    meta: { numeric: true },
    cell: (info) => formatCents(info.getValue()),
  }),
];

function isSortField(value: string): value is OrderSortField {
  return ORDER_SORT_FIELDS.some((field) => field === value);
}

interface OrdersTableProps {
  orders: OrderSummary[];
  sort: OrderSortField;
  order: 'asc' | 'desc';
  onSortChange: (sort: OrderSortField, order: 'asc' | 'desc') => void;
  density: TableDensity;
  isUpdating: boolean;
}

export function OrdersTable({
  orders,
  sort,
  order,
  onSortChange,
  density,
  isUpdating,
}: OrdersTableProps) {
  const sorting: SortingState = [{ id: sort, desc: order === 'desc' }];

  // Sorting and paging happen on the server, so the table only renders the rows it's
  // given and reports sort changes back up.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange: (updater) => {
      const [next] = typeof updater === 'function' ? updater(sorting) : updater;
      if (next && isSortField(next.id)) onSortChange(next.id, next.desc ? 'desc' : 'asc');
    },
  });

  return (
    <div className={styles.scroller}>
      <table className={styles.table} data-density={density} aria-busy={isUpdating}>
        <caption className="visually-hidden">
          Orders, sorted by {sort === 'totalCents' ? 'total' : sort} (
          {order === 'asc' ? 'ascending' : 'descending'})
        </caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const isNumeric = header.column.columnDef.meta?.numeric === true;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={isNumeric ? styles.numeric : undefined}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className={styles.sortIcon} aria-hidden="true">
                          {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={
                    cell.column.columnDef.meta?.numeric ? styles.numeric : undefined
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
