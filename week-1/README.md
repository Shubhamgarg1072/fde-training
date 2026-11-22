# Week 1: Slow Pour storefront

A one-page shop for coffee brewing gear, built with plain HTML, CSS and JavaScript.
It loads a product catalogue and lets you filter, sort and add items to a cart. The
cart persists across reloads and stays in sync between tabs. Vite is used only as a
dev server and bundler. There is no framework.

## Running it

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # cart logic, using node:test
npm run lint
npm run build && npm run preview
```

## Project structure

```
index.html              page markup, plus <template> elements for cards and cart lines
public/products.json    the catalogue, fetched at runtime
src/
  main.js               wires everything together on load
  products.js           fetches the catalogue
  catalogue.js          renders the grid, loading and error states, filter controls
  catalogue-filters.js  filter and sort logic, and syncing them to the URL
  cart.js               pure cart functions (no DOM, no storage)
  cart.test.js          tests for cart.js
  cart-store.js         cart state, localStorage persistence, subscribers
  cart-drawer.js        the cart dialog
  announcer.js          polite live region for screen reader announcements
  format.js             currency formatting
  styles.css            design tokens, layout, components
```

## Decisions and trade-offs

**Prices are integers in cents.** `0.1 + 0.2` is not `0.3` in JavaScript, and cart totals
are sums of products. Keeping cents as integers avoids rounding drift. We only convert
to dollars when formatting, with `Intl.NumberFormat`.

**The cart stores product ids and quantities, never prices.** Totals are always worked
out from the current catalogue. If a price changes, a returning visitor sees the new
price, not whatever was in their localStorage. Saved lines whose product no longer
exists are dropped once the catalogue loads.

**Cart logic is split from cart state.** `cart.js` holds pure functions that take an
array and return a new one, so they're easy to test with `node:test` and no DOM.
`cart-store.js` wraps them in module-scoped state (a closure over `items` and a
`Set` of listeners) and handles persistence. Components subscribe instead of reaching
into each other.

**localStorage can fail.** Reads are wrapped in `try/catch` and validated item by item,
because the stored value can be corrupted or edited by hand. A failed write (quota
exceeded, storage disabled) still leaves the cart working for the current visit. A
`storage` event listener keeps two open tabs in sync.

**DOM is built from `<template>` elements and `textContent`.** No `innerHTML` with data,
so a product name can't inject markup. Templates also keep the markup in the HTML file
where it's easy to read.

**The cart drawer is a native `<dialog>` opened with `showModal()`.** That gives us
focus containment, Escape to close and an inert background for free. Without it we
would need a focus trap and `aria-modal` handling. We still return focus to the cart
button on close, because older Safari doesn't do it.

**Cart lines are fully re-rendered on every change.** That's simpler than patching
individual nodes, and the list is short. The cost is that focus would be lost on each
re-render, so `cart-drawer.js` records which control had focus and restores it. After
a removal, focus moves to the next line's Remove button, or to the heading if the cart
is empty.

**Category filters are radio buttons styled as chips.** A radio group already has the
right semantics (one choice from a set) and arrow-key navigation. Toggle buttons with
`aria-pressed` would need us to rebuild both. Filter and sort live in the URL via
`replaceState`, so a filtered view can be shared. Changing a filter doesn't add a
history entry.

**`aria-disabled` instead of `disabled` on the + button at the max quantity.** A disabled
button drops focus and is skipped by Tab, which is confusing when you've just pressed
it. The click handler ignores it instead.

**Layout shift.** Lighthouse flagged a CLS of 0.30. The category chips were injected
after the fetch, and the loading placeholders were shorter than real cards. The chips
are now static markup and the placeholders use the same proportions as a card. CLS is
under 0.05 and all four Lighthouse categories score 100 on the production build.

## Accessibility checks

- axe-core (WCAG 2.1 A and AA rules) with the page loaded and with the cart open: no
  violations.
- Keyboard: skip link, every control reachable, visible focus ring, Escape closes the
  cart, focus is kept through quantity changes and removals.
- Screen readers: add and remove are announced through a polite live region. Buttons
  include the product name ("Add Hand grinder to cart") so they make sense out of
  context.
- Colour pairs checked against 4.5:1. The lowest is muted text on paper at 5.5:1.

## Known limitations

- No checkout. The drawer ends at the order total.
- The catalogue is a static JSON file, with no stock levels or variants.
- Product images are colour swatches with a monogram rather than photos.
- Prices are USD only, and the quantity per line is capped at 10.
