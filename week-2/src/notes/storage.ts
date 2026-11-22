import { z } from 'zod';
import { noteSchema, type Note } from './schema.ts';

export const STORAGE_KEY = 'margin:notes';
export const BACKUP_KEY = 'margin:notes:backup';

const storedNotesSchema = z.object({
  version: z.literal(1),
  notes: z.array(z.unknown()),
});

export type LoadResult =
  | { status: 'ok'; notes: Note[] }
  | { status: 'partial'; notes: Note[]; discarded: number }
  | { status: 'corrupt'; notes: Note[] };

export function loadNotes(): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { status: 'ok', notes: [] };
  }
  if (raw === null) return { status: 'ok', notes: [] };

  const envelope = storedNotesSchema.safeParse(parseJson(raw));
  if (!envelope.success) {
    // The next save would overwrite whatever is there, so keep a copy the user can recover by hand.
    trySetItem(BACKUP_KEY, raw);
    return { status: 'corrupt', notes: [] };
  }

  // Validate note by note so one bad entry doesn't cost the user every other note.
  const notes: Note[] = [];
  for (const candidate of envelope.data.notes) {
    const result = noteSchema.safeParse(candidate);
    if (result.success) notes.push(result.data);
  }
  const discarded = envelope.data.notes.length - notes.length;
  return discarded > 0
    ? { status: 'partial', notes, discarded }
    : { status: 'ok', notes };
}

export function saveNotes(notes: Note[]): boolean {
  return trySetItem(STORAGE_KEY, JSON.stringify({ version: 1, notes }));
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function trySetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
