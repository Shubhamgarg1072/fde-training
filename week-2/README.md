# Week 2: Margin notes app

A notes app built with React 19 and strict TypeScript. You can create notes, tag
them, pin the important ones, search by text or tag, and delete with undo. Everything
is stored in `localStorage` and checked against a zod schema when it loads.

## Running it

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest + Testing Library
npm run typecheck
npm run lint
npm run build && npm run preview
```

## Project structure

```
src/
  main.tsx                  entry point, global styles
  App.tsx                   loads saved notes, top-level error boundary
  NotesApp.tsx              layout, search state, delete/undo, focus management
  notes/
    schema.ts               zod schemas; the Note type is inferred from them
    storage.ts              load/save with per-note validation and a corrupt-data backup
    notesReducer.ts         all state transitions, actions as a discriminated union
    notesContext.ts         contexts and the hooks that read them
    NotesProvider.tsx       useReducer + debounced persistence
    useNoteSearch.ts        text and tag filtering, sorting, deferred query
    sortNotes.ts            pinned first, then most recently edited
    NoteList.tsx, NoteListItem.tsx, NoteEditor.tsx, TagEditor.tsx,
    SearchControls.tsx, StorageNotice.tsx
  components/
    ErrorBoundary.tsx, UndoToast.tsx, icons.tsx
  lib/formatRelativeTime.ts
```

Tests sit next to the code they cover (`*.test.ts(x)`). `App.test.tsx` drives the whole
app through the UI.

## Decisions and trade-offs

**The zod schema is the source of truth for the `Note` type.** `type Note =
z.infer<typeof noteSchema>`, so the runtime check on load and the compile-time type
can't drift apart. Tag rules (trimmed, lowercase, letters, numbers and dashes) live in
`tagSchema`. The tag input uses the same schema to validate and show errors.

**Loading validates each note separately.** `loadNotes` returns a discriminated union:
`ok`, `partial` (some notes dropped, with a count) or `corrupt`. A single malformed
entry costs one note, not all of them. If the stored data can't be read at all, the raw
string is copied to `margin:notes:backup` before the next save overwrites it, and the
UI says where to find it. `StorageNotice` switches on the union, so TypeScript catches
an unhandled status.

**useReducer + Context rather than a state library.** There is one store with six
actions, which `useReducer` handles fine. The reducer is pure: ids and timestamps are
created by the caller and passed in on the action, so tests don't need fake timers or
mocked `crypto`. Unknown actions hit `assertNever`, so a new action that isn't handled
fails type checking.

**State and dispatch are in separate contexts.** Components that only send actions
don't re-render when the notes change. Save-failure status has its own context for
the same reason.

**Persistence is debounced by 400 ms.** The editor dispatches on every keystroke. We
don't want to serialise every note to `localStorage` on each one. A `pagehide`
listener flushes the latest notes immediately, so closing the tab mid-debounce
doesn't lose the last edit.

**Search uses `useDeferredValue` instead of a debounce.** The input updates at normal
priority and filtering runs at low priority. Typing never lags and there's no fixed
delay. While the deferred value catches up, the list dims slightly (`isStale`).

**A tag filter for a tag that no longer exists is ignored during render.** We don't
use an effect to reset it. `useNoteSearch` derives `activeTag` from the current tag
list, which avoids an extra render and a frame where the list would be empty.

**List items are memoised.** `NoteListItem` is wrapped in `memo`, `onSelect` is a
stable `useCallback` over `dispatch`, and the reducer only replaces the note that
changed. While typing in the editor, only the item for that note re-renders. To check
it, record a few keystrokes in the React DevTools Profiler. Every other
`NoteListItem` should show "Did not render".

**Delete is immediate, with an undo toast.** A confirm dialog interrupts every delete
to guard against the rare mistake. Undo costs nothing when you meant it. The toast's
8-second timer pauses on hover and focus (WCAG 2.2.1), and focus moves to Undo, so
keyboard users can reach it straight away.

**Focus is managed explicitly when the focused element unmounts.** Closing the editor
puts focus on that note in the list. Undo focuses the restored note's title. Dismissing
the toast moves focus to "New note". `NotesApp` records a selector in a ref, and an
effect moves focus after React commits.

**Error boundaries at two levels.** One around the editor is keyed by note id. A note
that fails to render shows a recoverable message, and the rest of the app keeps
working. A top-level one catches everything else. Error boundaries are still class
components because there's no hook for `getDerivedStateFromError`.

**Bundle size.** The production JS is about 97 kB gzipped. Most of that is React and
zod. `zod/mini` is smaller, but its functional API is noisier. We haven't
switched, because the app is local-only and loads once.

## Quality checks

- 34 tests: reducer, storage, search, error boundary and full user flows.
- axe-core (WCAG 2.1 A/AA), light and dark mode, on these screens: empty state,
  filled list, tag error, active search, undo toast and mobile list. No violations.
- Lighthouse on the production build: 100 for performance, accessibility, best
  practices and SEO.
- TypeScript runs with `strict`, `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. ESLint uses `strictTypeChecked` and the React hooks
  rules.

## Known limitations

- Notes live in one browser's `localStorage` (around 5 MB). There's no sync or export.
- The body is plain text. No Markdown rendering.
- Relative times ("5 minutes ago") update only when the list re-renders.
- Edits in two tabs at the same time aren't merged. The last tab to save wins.
