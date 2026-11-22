import { useCallback, useMemo } from 'react';
import { useNotesDispatch, useNotesState } from './notes/notesContext.ts';
import { createNote } from './notes/schema.ts';
import { sortNotes } from './notes/sortNotes.ts';
import { NoteList } from './notes/NoteList.tsx';
import { NoteEditor } from './notes/NoteEditor.tsx';
import { PlusIcon } from './components/icons.tsx';
import styles from './NotesApp.module.css';

export function NotesApp() {
  const { notes, selectedId } = useNotesState();
  const dispatch = useNotesDispatch();
  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);
  const selectedNote = notes.find((note) => note.id === selectedId) ?? null;

  const handleSelect = useCallback(
    (id: string) => {
      dispatch({ type: 'selected', id });
    },
    [dispatch],
  );

  function handleCreate() {
    dispatch({ type: 'created', note: createNote() });
  }

  return (
    <div className={styles.shell} data-view={selectedNote ? 'editor' : 'list'}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Margin</h1>
        <button type="button" className="button button--primary" onClick={handleCreate}>
          <PlusIcon />
          New note
        </button>
      </header>

      <div className={styles.panes}>
        <nav className={styles.sidebar} aria-label="Notes">
          <NoteList
            notes={sortedNotes}
            selectedId={selectedId}
            onSelect={handleSelect}
            emptyMessage="No notes yet. Create your first one."
          />
        </nav>

        <main className={styles.main}>
          {selectedNote ? (
            <NoteEditor key={selectedNote.id} note={selectedNote} />
          ) : (
            <div className={styles.placeholder}>
              <h2>{notes.length === 0 ? 'No notes yet' : 'Nothing open'}</h2>
              <p>
                {notes.length === 0
                  ? 'Create your first one. Notes are saved in this browser as you type.'
                  : 'Pick a note from the list, or start a new one.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
