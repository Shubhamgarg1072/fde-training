import type { Note } from './schema.ts';

export function sortNotes(notes: Note[]): Note[] {
  return notes.toSorted((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    // ISO 8601 strings in UTC sort correctly as plain strings.
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
