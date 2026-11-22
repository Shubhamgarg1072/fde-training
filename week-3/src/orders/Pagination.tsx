import { useId } from 'react';
import { PAGE_SIZES } from './schemas.ts';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageSizeId = useId();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <p aria-live="polite">
        {first}–{last} of {total}
      </p>
      <div className={styles.size}>
        <label htmlFor={pageSizeId}>Rows per page</label>
        <select
          id={pageSizeId}
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value));
          }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.buttons}>
        <button
          type="button"
          className="button"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          Previous
        </button>
        <span className={styles.pageCount}>
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className="button"
          disabled={page >= pageCount}
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
