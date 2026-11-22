import { errorMessage } from '../lib/apiError.ts';

interface QueryErrorProps {
  error: unknown;
  title: string;
  onRetry: () => void;
}

export function QueryError({ error, title, onRetry }: QueryErrorProps) {
  return (
    <div className="card query-error" role="alert">
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
