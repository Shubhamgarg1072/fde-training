import type { Note, NoteChanges } from './schema.ts';

export interface NotesState {
  notes: Note[];
  selectedId: string | null;
}

// Timestamps and ids come in on the action so the reducer stays pure and easy to test.
export type NotesAction =
  | { type: 'created'; note: Note }
  | { type: 'updated'; id: string; changes: NoteChanges; at: string }
  | { type: 'pinToggled'; id: string }
  | { type: 'deleted'; id: string }
  | { type: 'restored'; note: Note }
  | { type: 'selected'; id: string | null };

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case 'created':
      return { notes: [action.note, ...state.notes], selectedId: action.note.id };

    case 'updated':
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.id
            ? { ...note, ...action.changes, updatedAt: action.at }
            : note,
        ),
      };

    case 'pinToggled':
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.id ? { ...note, pinned: !note.pinned } : note,
        ),
      };

    case 'deleted':
      return {
        notes: state.notes.filter((note) => note.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };

    case 'restored':
      if (state.notes.some((note) => note.id === action.note.id)) return state;
      return { notes: [...state.notes, action.note], selectedId: action.note.id };

    case 'selected':
      return { ...state, selectedId: action.id };

    default:
      return assertNever(action);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled notes action: ${JSON.stringify(value)}`);
}
