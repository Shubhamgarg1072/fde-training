# Week 3: Slow Pour Admin

An internal admin for the week 1 shop. Staff sign in to work through orders (search,
filter, sort, page, change status) and manage the product catalogue. There's no real
backend. A Mock Service Worker API handles `/api` in the browser, with sessions,
rotating refresh tokens and validation, so the frontend runs against realistic network
behaviour.

Demo account: `ops@slowpour.example` / `brew-better`.

## Running it

```sh
npm install
npm run dev              # http://localhost:5173
npm test                 # unit and integration tests (Vitest, MSW in Node)
npm run test:e2e         # Playwright + axe against the production build
npm run typecheck
npm run lint
```

The first `test:e2e` run needs a browser: `npx playwright install chromium`.

To reset the demo data, clear the site's localStorage. The mock API keeps its state
under `mock-api:*`.

## Project structure

```
src/
  main.tsx                starts the MSW worker, then renders
  App.tsx                 QueryClientProvider > AuthGate > RouterProvider
  app/
    router.tsx            route tree; pages are lazy-loaded
    AppLayout.tsx         navigation, sign out, route loading bar
    queryClient.ts        retry rules, cache cleared on sign-out
  auth/
    authStore.ts          Zustand: status, access token (memory only), user
    AuthGate.tsx          restores the session from the refresh cookie on load
    RequireAuth.tsx       protected-route layout
    LoginPage.tsx         React Hook Form + zod
  lib/
    apiClient.ts          axios instance, bearer header, single-flight refresh on 401
    apiError.ts           typed access to API error bodies
  orders/
    schemas.ts            zod schemas shared with the mock API, status transitions
    useOrderListParams.ts URL search params as the list's state
    OrdersPage.tsx, OrdersTable.tsx (TanStack Table), Pagination.tsx
    OrderDetailPage.tsx, StatusUpdateForm.tsx, useUpdateOrderStatus.ts (optimistic)
  products/
    schemas.ts            API schema and form schema (dollars vs cents)
    ProductsPage.tsx, ProductFormPage.tsx, ProductForm.tsx
  ui/                     FormField, TextField, ConfirmDialog, PageHeading, prefs store
  mocks/                  MSW handlers, seeded data, localStorage-backed "database"
e2e/                      Playwright specs and axe checks
```

## Decisions and trade-offs

### Auth and tokens

**The access token lives in memory only.** It sits in a Zustand store that is never
persisted. Anything in `localStorage` can be read by any script that runs on the page,
so one XSS bug would leak a long-lived credential. Memory is cleared on reload, so
the session is restored with a refresh token instead.

**The refresh token is a cookie.** In production it would be `HttpOnly; Secure;
SameSite=Strict`, scoped to `/api/auth`, so JavaScript can't read it at all. The mock
can't set `HttpOnly` (MSW writes mocked cookies itself, from page JavaScript), so the
mock cookie is readable. Nothing in the app code depends on that.

**Refresh tokens rotate, and reuse revokes the session.** Each refresh returns a new
refresh token and retires the old one. If a retired token comes back, someone has a
copy, so the mock API revokes the whole token family and both parties have to sign
in again. An e2e test replays an old token to check this.

**Refresh is single-flight.** When the access token expires, several requests can
fail with 401 at once. They all await one shared refresh promise. Firing several
refreshes would present a token the server has already rotated, which the reuse check
above treats as theft. React StrictMode also runs the startup refresh twice in
development, and the shared promise covers that too.

**Refresh is reactive, not scheduled.** We refresh when a request returns 401, rather
than on a timer before expiry. It costs one extra round trip every 5 minutes of
activity. In exchange there are no timers to manage and nothing breaks when the
laptop sleeps.

**Signing out clears the query cache.** `queryClient.ts` subscribes to the auth store
and clears TanStack Query's cache when the session ends. Otherwise the next person on
the same browser could see the previous user's orders for a frame.

### Data fetching and state

**Server state goes in TanStack Query. Client state goes in Zustand, and only where
it's shared.** Orders and products are cached, refetched and invalidated through
Query. Zustand holds the session and one UI preference (table density, persisted with
`persist`). Everything else is component state or URL state.

**The orders list's state is the URL.** Page, page size, sort, status and search come
from `useSearchParams`. They are parsed with the same zod schema the mock API uses,
with `.catch()` defaults, so a hand-edited URL never crashes the page. Filtered views
can be bookmarked and shared, and "All orders" on the detail page returns to the same
view.

**Sorting and pagination happen on the server.** TanStack Table runs with
`manualSorting` and only renders the rows it receives. `keepPreviousData` keeps the
current page on screen while the next one loads, with the table marked `aria-busy`.
The next page is prefetched.

**Status changes are optimistic.** The badge and history update immediately. If the
server rejects the change, the cached order is restored from the snapshot taken in
`onMutate`, and the server's message is shown. Allowed transitions come from one
`STATUS_TRANSITIONS` map. The UI uses it to decide what to offer and the mock API uses
it to enforce the rules.

**zod schemas sit at every boundary.** API responses are parsed, not cast. The
product form has its own schema: price in dollars, a category that may still be
empty, a SKU normalised to upper case. Cents only appear in the API payload, via
`toProductInput`. 409 and 422 field errors from the server are mapped onto the
matching input with `setError`, so they look and behave like client-side errors.

### UX and accessibility

- Leaving the product form with unsaved edits opens a confirm dialog (`useBlocker`).
  Closing the tab triggers the browser's own prompt (`beforeunload`). The dialog is a
  native `<dialog>`, and the safe option has focus.
- After a client-side navigation, the new page's `<h1>` takes focus. That tells screen
  reader users the page changed. It happens when the heading mounts, so pages that
  show a spinner first work as well.
- Every form control gets its label, hint and error through `FormField`, using
  `aria-describedby` and `aria-invalid`. React Hook Form moves focus to the first
  invalid field.
- Page titles use React 19's `<title>` in components.

### Mock API

MSW runs in every build, including production, because there is no backend.
`VITE_USE_MOCKS=false` turns it off. Seed data comes from a fixed PRNG and a fixed
"today", so every machine and every test run gets the same 137 orders. The mock keeps
its state in `localStorage` so reloads behave like a real server. Note that MSW stores
mocked cookies in its own store (`__msw-cookie-store__`), which takes precedence over
`document.cookie`.

## Quality checks

- 19 Vitest tests: schemas, seed data and the axios refresh logic against MSW in Node
  (parallel 401s, failed refresh, no retry loop, no refresh on login failure).
- 19 Playwright tests against the production build. Axe (WCAG 2.1 A/AA) runs on sign
  in, the orders list, order detail, the product form with errors, the discard dialog
  and a phone-width view. No violations.
- Lighthouse on the production login page: accessibility 100, best practices 96,
  performance 90. SEO scores 63 because `robots.txt` deliberately blocks crawling of an
  admin tool. The best-practices deductions are the 401 the startup refresh logs when
  nobody is signed in, and production source maps not being published.

## Known limitations

- The MSW worker is about 157 kB gzipped and delays first paint. It disappears with a
  real API. The app bundle itself is about 170 kB gzipped, and route-level code
  splitting keeps the orders and products pages out of it.
- Two tabs refreshing at the same moment can trip the reuse check and sign both out. A
  real API would allow a short grace window for the previous token.
- One role only. There's no permission model or 403 handling yet.
- Order search is a substring match, done in memory by the mock.
