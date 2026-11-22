import { BACKUP_KEY, STORAGE_KEY, loadNotes, saveNotes } from './storage.ts';
import { createNote } from './schema.ts';

describe('loadNotes', () => {
  it('returns an empty list on first visit', () => {
    expect(loadNotes()).toEqual({ status: 'ok', notes: [] });
  });

  it('round-trips notes through saveNotes', () => {
    const note = { ...createNote(), title: 'Groceries', tags: ['home'] };
    saveNotes([note]);
    expect(loadNotes()).toEqual({ status: 'ok', notes: [note] });
  });

  it('keeps valid notes and counts the ones it had to drop', () => {
    const good = createNote();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, notes: [good, { id: 'broken', title: 42 }] }),
    );
    expect(loadNotes()).toEqual({ status: 'partial', notes: [good], discarded: 1 });
  });

  it('backs up storage it cannot read at all', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadNotes()).toEqual({ status: 'corrupt', notes: [] });
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{not json');
  });

  it('treats an unknown version as unreadable', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, notes: [] }));
    expect(loadNotes().status).toBe('corrupt');
  });

  it('normalises tags through the schema', () => {
    const note = { ...createNote(), tags: ['  Work '] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, notes: [note] }));
    const result = loadNotes();
    expect(result.notes[0]?.tags).toEqual(['work']);
  });
});
