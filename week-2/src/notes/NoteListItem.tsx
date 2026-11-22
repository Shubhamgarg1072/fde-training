import { memo } from 'react';
import type { Note } from './schema.ts';
import { PinIcon } from '../components/icons.tsx';
import { formatAbsoluteTime, formatRelativeTime } from '../lib/formatRelativeTime.ts';
import styles from './NoteListItem.module.css';

interface NoteListItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const PREVIEW_LENGTH = 90;

function previewOf(body: string): string {
  const firstLine = body.trim().split('\n', 1)[0] ?? '';
  return firstLine.length > PREVIEW_LENGTH
    ? `${firstLine.slice(0, PREVIEW_LENGTH)}…`
    : firstLine;
}

// Memoised so typing in the editor only re-renders the item for the note being edited.
export const NoteListItem = memo(function NoteListItem({
  note,
  isSelected,
  onSelect,
}: NoteListItemProps) {
  const preview = previewOf(note.body);

  return (
    <button
      type="button"
      className={styles.item}
      data-note-id={note.id}
      aria-current={isSelected ? 'true' : undefined}
      onClick={() => {
        onSelect(note.id);
      }}
    >
      <span className={styles.titleRow}>
        <span className={styles.title}>{note.title.trim() || 'Untitled'}</span>
        {note.pinned && (
          <>
            <PinIcon className={styles.pin} width={14} height={14} />
            <span className="visually-hidden">, pinned</span>
          </>
        )}
      </span>
      <span className={styles.preview}>{preview || 'No additional text'}</span>
      <time
        className={styles.time}
        dateTime={note.updatedAt}
        title={formatAbsoluteTime(note.updatedAt)}
      >
        {formatRelativeTime(note.updatedAt)}
      </time>
    </button>
  );
});
