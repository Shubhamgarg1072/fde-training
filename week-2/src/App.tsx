import { useState } from 'react';
import { NotesProvider } from './notes/NotesProvider.tsx';
import { loadNotes } from './notes/storage.ts';
import { NotesApp } from './NotesApp.tsx';

export function App() {
  const [loaded] = useState(loadNotes);

  return (
    <NotesProvider initialNotes={loaded.notes}>
      <NotesApp />
    </NotesProvider>
  );
}
