import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { notesReducer } from './notesReducer.ts';
import {
  NotesDispatchContext,
  NotesStateContext,
  SaveFailedContext,
} from './notesContext.ts';
import { saveNotes } from './storage.ts';
import type { Note } from './schema.ts';

const SAVE_DELAY_MS = 400;

interface NotesProviderProps {
  initialNotes: Note[];
  children: ReactNode;
}

export function NotesProvider({ initialNotes, children }: NotesProviderProps) {
  const [state, dispatch] = useReducer(notesReducer, initialNotes, (notes) => ({
    notes,
    selectedId: null,
  }));
  const [saveFailed, setSaveFailed] = useState(false);
  const latestNotes = useRef(state.notes);

  // Typing dispatches on every keystroke, so writes to localStorage are debounced.
  useEffect(() => {
    latestNotes.current = state.notes;
    const timeout = setTimeout(() => {
      setSaveFailed(!saveNotes(state.notes));
    }, SAVE_DELAY_MS);
    return () => {
      clearTimeout(timeout);
    };
  }, [state.notes]);

  // Flush immediately if the tab is closed inside the debounce window.
  useEffect(() => {
    const flush = () => saveNotes(latestNotes.current);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return (
    <NotesStateContext value={state}>
      <NotesDispatchContext value={dispatch}>
        <SaveFailedContext value={saveFailed}>{children}</SaveFailedContext>
      </NotesDispatchContext>
    </NotesStateContext>
  );
}
