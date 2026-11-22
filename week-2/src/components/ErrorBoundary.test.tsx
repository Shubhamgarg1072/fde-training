import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary.tsx';

let shouldThrow = true;

function Flaky() {
  if (shouldThrow) throw new Error('render failed');
  return <p>Recovered</p>;
}

function Harness() {
  const [resets, setResets] = useState(0);
  return (
    <ErrorBoundary
      key={resets}
      fallback={(reset) => (
        <button
          type="button"
          onClick={() => {
            shouldThrow = false;
            reset();
            setResets((count) => count + 1);
          }}
        >
          Try again
        </button>
      )}
    >
      <Flaky />
    </ErrorBoundary>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    // React logs caught render errors; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the fallback and recovers after a reset', async () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
