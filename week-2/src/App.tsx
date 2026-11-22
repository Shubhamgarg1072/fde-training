import { useState } from 'react';
import { NotesProvider } from './notes/NotesProvider.tsx';
import { loadNotes } from './notes/storage.ts';
import { NotesApp } from './NotesApp.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function AppCrashed() {
  return (
    <div className="crash" role="alert">
      <h1>Margin ran into a problem</h1>
      <p>Your notes are saved in this browser. Reloading the page usually fixes this.</p>
      <button
        type="button"
        className="button button--primary"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload
      </button>
    </div>
  );
}

export function App() {
  const [loaded] = useState(loadNotes);

  return (
    <ErrorBoundary fallback={() => <AppCrashed />}>
      <NotesProvider initialNotes={loaded.notes}>
        <NotesApp loadResult={loaded} />
      </NotesProvider>
    </ErrorBoundary>
  );
}
