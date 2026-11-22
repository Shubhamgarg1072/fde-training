import { useDeferredValue, useMemo } from 'react';
import type { Note } from './schema.ts';
import { sortNotes } from './sortNotes.ts';

export function filterNotes(notes: Note[], query: string, tag: string | null): Note[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return notes.filter((note) => {
    if (tag && !note.tags.includes(tag)) return false;
    if (terms.length === 0) return true;
    const haystack = `${note.title}\n${note.body}\n${note.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function useNoteSearch(notes: Note[], query: string, tag: string | null) {
  // Filtering runs at a lower priority than the keystroke, so the search box never lags
  // behind typing even with a few thousand notes.
  const deferredQuery = useDeferredValue(query);

  const allTags = useMemo(
    () => [...new Set(notes.flatMap((note) => note.tags))].sort(),
    [notes],
  );

  // A tag filter for a tag that no longer exists (its last note was deleted or untagged)
  // falls back to showing everything, without needing an effect to reset it.
  const activeTag = tag !== null && allTags.includes(tag) ? tag : null;

  const results = useMemo(
    () => filterNotes(sortNotes(notes), deferredQuery, activeTag),
    [notes, deferredQuery, activeTag],
  );

  return { results, allTags, activeTag, isStale: query !== deferredQuery };
}
