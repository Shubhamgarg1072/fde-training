import { useId, useState, type SubmitEvent } from 'react';
import { useUpdateOrderStatus } from './useUpdateOrderStatus.ts';
import { STATUS_LABELS } from './statusLabels.ts';
import { STATUS_TRANSITIONS, type Order, type OrderStatus } from './schemas.ts';
import { errorMessage } from '../lib/apiError.ts';
import styles from './OrderDetailPage.module.css';

export function StatusUpdateForm({ order }: { order: Order }) {
  const options = STATUS_TRANSITIONS[order.status];
  const [selected, setSelected] = useState<OrderStatus | ''>('');
  const updateStatus = useUpdateOrderStatus(order.id);
  const selectId = useId();

  if (options.length === 0) {
    return (
      <p className={styles.muted}>
        This order is {STATUS_LABELS[order.status].toLowerCase()}, so its status can't
        change.
      </p>
    );
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected === '') return;
    updateStatus.mutate(selected, {
      onSuccess: () => {
        setSelected('');
      },
    });
  }

  return (
    <form className={styles.statusForm} onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor={selectId}>Change status to</label>
        <select
          id={selectId}
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value as OrderStatus | '');
          }}
        >
          <option value="">Choose a status</option>
          {options.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      {selected === 'cancelled' && (
        <p className={styles.warning}>
          Cancelling can't be undone. The customer is refunded in full.
        </p>
      )}
      <button
        type="submit"
        className="button button--primary"
        disabled={selected === '' || updateStatus.isPending}
      >
        {updateStatus.isPending ? 'Updating…' : 'Update status'}
      </button>

      <div aria-live="polite" className={styles.feedback}>
        {updateStatus.isSuccess && (
          <p>Marked as {STATUS_LABELS[updateStatus.data.status]}.</p>
        )}
      </div>
      {updateStatus.isError && (
        <p className="alert" role="alert">
          {errorMessage(updateStatus.error, "The status couldn't be updated. Try again.")}
        </p>
      )}
    </form>
  );
}
