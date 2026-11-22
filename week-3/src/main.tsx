import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import { App } from './App.tsx';

// There is no real backend, so the MSW worker serves /api in every build. Setting
// VITE_USE_MOCKS=false points the app at a real API on the same origin instead.
async function startMockApi() {
  if (import.meta.env.VITE_USE_MOCKS === 'false') return;
  const { worker } = await import('./mocks/browser.ts');
  await worker.start({ onUnhandledFrame: 'bypass', quiet: import.meta.env.PROD });
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

void startMockApi().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
