import { notesReducer, type NotesState } from './notesReducer.ts';
import { createNote, type Note } from './schema.ts';

function noteWith(overrides: Partial<Note>): Note {
  return { ...createNote(new Date('2026-01-01T09:00:00.000Z')), ...overrides };
}

const first = noteWith({ id: 'first', title: 'First' });
const second = noteWith({ id: 'second', title: 'Second' });
const initial: NotesState = { notes: [first, second], selectedId: 'first' };

describe('notesReducer', () => {
  it('adds a created note to the top and selects it', () => {
    const created = noteWith({ id: 'new' });
    const next = notesReducer(initial, { type: 'created', note: created });
    expect(next.notes.map((note) => note.id)).toEqual(['new', 'first', 'second']);
    expect(next.selectedId).toBe('new');
  });

  it('applies changes and bumps updatedAt', () => {
    const at = '2026-02-01T10:00:00.000Z';
    const next = notesReducer(initial, {
      type: 'updated',
      id: 'second',
      changes: { body: 'Hello' },
      at,
    });
    expect(next.notes[1]).toEqual({ ...second, body: 'Hello', updatedAt: at });
    expect(next.notes[0]).toBe(first);
  });

  it('toggles pinned without touching updatedAt', () => {
    const next = notesReducer(initial, { type: 'pinToggled', id: 'first' });
    expect(next.notes[0]?.pinned).toBe(true);
    expect(next.notes[0]?.updatedAt).toBe(first.updatedAt);
  });

  it('clears the selection when the selected note is deleted', () => {
    const next = notesReducer(initial, { type: 'deleted', id: 'first' });
    expect(next.notes).toEqual([second]);
    expect(next.selectedId).toBeNull();
  });

  it('keeps the selection when another note is deleted', () => {
    expect(notesReducer(initial, { type: 'deleted', id: 'second' }).selectedId).toBe(
      'first',
    );
  });

  it('restores a deleted note once, even if undo fires twice', () => {
    const deleted = notesReducer(initial, { type: 'deleted', id: 'second' });
    const restored = notesReducer(deleted, { type: 'restored', note: second });
    expect(notesReducer(restored, { type: 'restored', note: second })).toBe(restored);
    expect(restored.notes).toHaveLength(2);
  });
});
