import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotesDispatch, useNotesState } from './notes/notesContext.ts';
import { createNote, type Note } from './notes/schema.ts';
import { useNoteSearch } from './notes/useNoteSearch.ts';
import { SearchControls } from './notes/SearchControls.tsx';
import { StorageNotice } from './notes/StorageNotice.tsx';
import type { LoadResult } from './notes/storage.ts';
import { NoteList } from './notes/NoteList.tsx';
import { NoteEditor } from './notes/NoteEditor.tsx';
import { PlusIcon } from './components/icons.tsx';
import { UndoToast } from './components/UndoToast.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import styles from './NotesApp.module.css';

export function NotesApp({ loadResult }: { loadResult: LoadResult }) {
  const { notes, selectedId } = useNotesState();
  const dispatch = useNotesDispatch();
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { results, allTags, activeTag, isStale } = useNoteSearch(notes, query, tagFilter);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Note | null>(null);
  const isFiltering = query.trim() !== '' || activeTag !== null;
  const selectedNote = notes.find((note) => note.id === selectedId) ?? null;

  // Some actions unmount the element that has focus (closing the editor, undoing a
  // delete). They record where focus should go, and this moves it after React commits.
  const shellRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    shellRef.current?.querySelector<HTMLElement>(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });

  const handleSelect = useCallback(
    (id: string) => {
      dispatch({ type: 'selected', id });
    },
    [dispatch],
  );

  const dismissUndo = useCallback(() => {
    if (document.activeElement?.closest('[data-toast]'))
      pendingFocus.current = '[data-new-note]';
    setRecentlyDeleted(null);
  }, []);

  const handleCloseEditor = useCallback(
    (noteId: string) => {
      pendingFocus.current = `[data-note-id="${CSS.escape(noteId)}"]`;
      dispatch({ type: 'selected', id: null });
    },
    [dispatch],
  );

  function handleCreate() {
    dispatch({ type: 'created', note: createNote() });
  }

  // Deleting is immediate and offers undo, rather than asking "Are you sure?" first.
  function handleDelete(note: Note) {
    dispatch({ type: 'deleted', id: note.id });
    setRecentlyDeleted(note);
  }

  function handleUndoDelete() {
    if (!recentlyDeleted) return;
    pendingFocus.current = '[data-note-title]';
    dispatch({ type: 'restored', note: recentlyDeleted });
    setRecentlyDeleted(null);
  }

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      data-view={selectedNote ? 'editor' : 'list'}
    >
      <header className={styles.header}>
        <h1 className={styles.brand}>Margin</h1>
        <button
          type="button"
          className="button button--primary"
          data-new-note
          onClick={handleCreate}
        >
          <PlusIcon />
          New note
        </button>
      </header>

      <StorageNotice loadResult={loadResult} />

      <div className={styles.panes}>
        <nav className={styles.sidebar} aria-label="Notes">
          {notes.length > 0 && (
            <SearchControls
              query={query}
              onQueryChange={setQuery}
              tags={allTags}
              activeTag={activeTag}
              onTagChange={setTagFilter}
            />
          )}
          <p className="visually-hidden" role="status">
            {isFiltering
              ? `${results.length} matching ${results.length === 1 ? 'note' : 'notes'}`
              : ''}
          </p>
          <div className={styles.results} data-stale={isStale}>
            <NoteList
              notes={results}
              selectedId={selectedId}
              onSelect={handleSelect}
              emptyMessage={
                isFiltering
                  ? 'No notes match that search.'
                  : 'No notes yet. Create your first one.'
              }
            />
          </div>
        </nav>

        <main className={styles.main}>
          {selectedNote ? (
            <ErrorBoundary
              key={selectedNote.id}
              fallback={(reset) => (
                <div className={styles.placeholder} role="alert">
                  <h2>This note couldn't be opened</h2>
                  <p>Something went wrong while showing it. Your other notes are fine.</p>
                  <div className={styles.placeholderActions}>
                    <button type="button" className="button" onClick={reset}>
                      Try again
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => {
                        handleCloseEditor(selectedNote.id);
                      }}
                    >
                      Back to all notes
                    </button>
                  </div>
                </div>
              )}
            >
              <NoteEditor
                note={selectedNote}
                onDelete={handleDelete}
                onClose={handleCloseEditor}
              />
            </ErrorBoundary>
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

      {recentlyDeleted && (
        <UndoToast
          key={recentlyDeleted.id}
          message={`Deleted "${recentlyDeleted.title.trim() || 'Untitled'}".`}
          onUndo={handleUndoDelete}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  );
}
