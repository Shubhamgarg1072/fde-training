import { errorMessage } from '../lib/apiError.ts';

interface QueryErrorProps {
  error: unknown;
  title: string;
  onRetry: () => void;
}

export function QueryError({ error, title, onRetry }: QueryErrorProps) {
  return (
    <div
      className="card"
      role="alert"
      style={{
        padding: 'var(--space-6)',
        display: 'grid',
        gap: 'var(--space-3)',
        justifyItems: 'start',
      }}
    >
      <h2>{title}</h2>
      <p>
        {errorMessage(
          error,
          'The server did not respond. Check your connection and try again.',
        )}
      </p>
      <button type="button" className="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
