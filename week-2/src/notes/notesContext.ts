import { createContext, useContext, type Dispatch } from 'react';
import type { NotesAction, NotesState } from './notesReducer.ts';

// State and dispatch live in separate contexts. Components that only dispatch (buttons,
// the editor's save calls) don't re-render when the notes array changes.
export const NotesStateContext = createContext<NotesState | null>(null);
export const NotesDispatchContext = createContext<Dispatch<NotesAction> | null>(null);
export const SaveFailedContext = createContext(false);

export function useNotesState(): NotesState {
  const state = useContext(NotesStateContext);
  if (!state) throw new Error('useNotesState must be used inside <NotesProvider>');
  return state;
}

export function useNotesDispatch(): Dispatch<NotesAction> {
  const dispatch = useContext(NotesDispatchContext);
  if (!dispatch) throw new Error('useNotesDispatch must be used inside <NotesProvider>');
  return dispatch;
}

export function useSaveFailed(): boolean {
  return useContext(SaveFailedContext);
}
