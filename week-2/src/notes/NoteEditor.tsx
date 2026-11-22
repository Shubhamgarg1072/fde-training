import { useId } from 'react';
import { useNotesDispatch } from './notesContext.ts';
import { NOTE_TITLE_MAX_LENGTH, type Note, type NoteChanges } from './schema.ts';
import { ArrowLeftIcon, PinIcon } from '../components/icons.tsx';
import { formatAbsoluteTime, formatRelativeTime } from '../lib/formatRelativeTime.ts';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const dispatch = useNotesDispatch();
  const titleId = useId();
  const bodyId = useId();
  const isBlank = note.title === '' && note.body === '';

  function update(changes: NoteChanges) {
    dispatch({ type: 'updated', id: note.id, changes, at: new Date().toISOString() });
  }

  return (
    <section className={styles.editor} aria-label="Editor">
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`button button--ghost ${styles.back}`}
          onClick={() => {
            dispatch({ type: 'selected', id: null });
          }}
        >
          <ArrowLeftIcon />
          All notes
        </button>
        <p className={styles.meta}>
          Edited{' '}
          <time dateTime={note.updatedAt} title={formatAbsoluteTime(note.updatedAt)}>
            {formatRelativeTime(note.updatedAt)}
          </time>
        </p>
        <button
          type="button"
          className="button"
          aria-pressed={note.pinned}
          onClick={() => {
            dispatch({ type: 'pinToggled', id: note.id });
          }}
        >
          <PinIcon />
          Pin
        </button>
      </div>

      <label htmlFor={titleId} className="visually-hidden">
        Title
      </label>
      <input
        id={titleId}
        className={styles.title}
        value={note.title}
        placeholder="Untitled"
        maxLength={NOTE_TITLE_MAX_LENGTH}
        autoComplete="off"
        // Only fires on mount, so this focuses the title of a freshly created note.
        autoFocus={isBlank}
        onChange={(event) => {
          update({ title: event.target.value });
        }}
      />

      <label htmlFor={bodyId} className="visually-hidden">
        Note
      </label>
      <textarea
        id={bodyId}
        className={styles.body}
        value={note.body}
        placeholder="Start writing…"
        onChange={(event) => {
          update({ body: event.target.value });
        }}
      />
    </section>
  );
}
