import { useCallback, useState } from 'react';
import { useNotesDispatch, useNotesState } from './notes/notesContext.ts';
import { createNote } from './notes/schema.ts';
import { useNoteSearch } from './notes/useNoteSearch.ts';
import { SearchControls } from './notes/SearchControls.tsx';
import { NoteList } from './notes/NoteList.tsx';
import { NoteEditor } from './notes/NoteEditor.tsx';
import { PlusIcon } from './components/icons.tsx';
import styles from './NotesApp.module.css';

export function NotesApp() {
  const { notes, selectedId } = useNotesState();
  const dispatch = useNotesDispatch();
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { results, allTags, activeTag, isStale } = useNoteSearch(notes, query, tagFilter);
  const isFiltering = query.trim() !== '' || activeTag !== null;
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
