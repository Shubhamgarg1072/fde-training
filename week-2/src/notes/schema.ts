import { z } from 'zod';

export const NOTE_TITLE_MAX_LENGTH = 120;
export const TAG_MAX_LENGTH = 24;
export const TAGS_PER_NOTE_MAX = 8;

export const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Tag is empty')
  .max(TAG_MAX_LENGTH, `Tags can be up to ${TAG_MAX_LENGTH} characters`)
  .regex(/^[\p{L}\p{N}-]+$/u, 'Tags can only use letters, numbers and dashes');

export const noteSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(NOTE_TITLE_MAX_LENGTH),
  body: z.string(),
  tags: z.array(tagSchema).max(TAGS_PER_NOTE_MAX),
  pinned: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Note = z.infer<typeof noteSchema>;
export type NoteChanges = Partial<Pick<Note, 'title' | 'body' | 'tags'>>;

export function createNote(now = new Date()): Note {
  const timestamp = now.toISOString();
  return {
    id: crypto.randomUUID(),
    title: '',
    body: '',
    tags: [],
    pinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
