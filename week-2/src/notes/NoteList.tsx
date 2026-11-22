import type { Note } from './schema.ts';
import { NoteListItem } from './NoteListItem.tsx';
import styles from './NoteList.module.css';

interface NoteListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage: string;
}

export function NoteList({ notes, selectedId, onSelect, emptyMessage }: NoteListProps) {
  if (notes.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <ul className={styles.list} role="list">
      {notes.map((note) => (
        <li key={note.id}>
          <NoteListItem
            note={note}
            isSelected={note.id === selectedId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
