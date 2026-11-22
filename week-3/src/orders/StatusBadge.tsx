import type { OrderStatus } from './schemas.ts';
import { STATUS_LABELS } from './statusLabels.ts';
import styles from './StatusBadge.module.css';

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={styles.badge} data-status={status}>
      {STATUS_LABELS[status]}
    </span>
  );
}
