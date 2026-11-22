import { renderHook } from '@testing-library/react';
import { filterNotes, useNoteSearch } from './useNoteSearch.ts';
import { createNote, type Note } from './schema.ts';

function note(overrides: Partial<Note>): Note {
  return { ...createNote(), ...overrides };
}

const groceries = note({
  id: 'groceries',
  title: 'Groceries',
  body: 'Oat milk, eggs',
  tags: ['home'],
  updatedAt: '2026-01-02T00:00:00.000Z',
});
const retro = note({
  id: 'retro',
  title: 'Sprint retro',
  body: 'Ship smaller PRs',
  tags: ['work'],
  updatedAt: '2026-01-03T00:00:00.000Z',
});
const pinnedOld = note({
  id: 'pinned',
  title: 'Wifi password',
  body: 'On the fridge',
  tags: ['home'],
  pinned: true,
  updatedAt: '2025-06-01T00:00:00.000Z',
});
const notes = [groceries, retro, pinnedOld];

describe('filterNotes', () => {
  it('matches title, body and tags case-insensitively', () => {
    expect(filterNotes(notes, 'GROCERIES', null)).toEqual([groceries]);
    expect(filterNotes(notes, 'smaller', null)).toEqual([retro]);
    expect(filterNotes(notes, 'work', null)).toEqual([retro]);
  });

  it('requires every term to match', () => {
    expect(filterNotes(notes, 'oat eggs', null)).toEqual([groceries]);
    expect(filterNotes(notes, 'oat retro', null)).toEqual([]);
  });

  it('combines the query with a tag', () => {
    expect(filterNotes(notes, '', 'home')).toEqual([groceries, pinnedOld]);
    expect(filterNotes(notes, 'fridge', 'home')).toEqual([pinnedOld]);
  });

  it('ignores surrounding whitespace in the query', () => {
    expect(filterNotes(notes, '   ', null)).toEqual(notes);
  });
});

describe('useNoteSearch', () => {
  it('returns pinned notes first, then most recently edited', () => {
    const { result } = renderHook(() => useNoteSearch(notes, '', null));
    expect(result.current.results.map((n) => n.id)).toEqual([
      'pinned',
      'retro',
      'groceries',
    ]);
  });

  it('lists each tag once, sorted', () => {
    const { result } = renderHook(() => useNoteSearch(notes, '', null));
    expect(result.current.allTags).toEqual(['home', 'work']);
  });

  it('drops a tag filter whose tag no longer exists', () => {
    const { result } = renderHook(() => useNoteSearch([groceries], '', 'work'));
    expect(result.current.activeTag).toBeNull();
    expect(result.current.results).toEqual([groceries]);
  });
});
