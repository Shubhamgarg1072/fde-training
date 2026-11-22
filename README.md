# FDE training

Assignments for weeks 1 to 3 of the frontend track. Each week is a separate app in
its own folder with its own `package.json`, so they can be installed and run
independently.

| Folder              | What it is                                  | Stack                                                     |
| ------------------- | ------------------------------------------- | --------------------------------------------------------- |
| [`week-1`](week-1/) | Storefront with a persistent cart           | HTML, CSS, JavaScript, Vite                               |
| [`week-2`](week-2/) | Notes app with search, tags and undo        | React, TypeScript, Zod                                    |
| [`week-3`](week-3/) | Orders admin with auth against a mocked API | React Router, TanStack Query and Table, Zustand, RHF, MSW |

## Running a week

Node 22 or newer.

```sh
cd week-1
npm install
npm run dev
```

Each week's README covers its scripts, structure and the decisions behind it.

## Conventions

- One branch per piece of work, merged into `main` through a squash-merged PR.
- Commit subjects follow Conventional Commits.
- Prettier config lives at the repo root and applies to every week.
