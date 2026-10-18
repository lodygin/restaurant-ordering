# My Kitchen — restaurant ordering prototype

A real-time ordering prototype: a guest menu with a cart and checkout, a live orders page, and a menu setup screen for the staff. Angular 22 on the client, NestJS on the server, one Nx monorepo.

## Run

Requirements: Node 24 and pnpm 11 (`corepack enable` picks the version from `package.json`).

```sh
pnpm install
pnpm start
```

- Client: http://localhost:4200 (Menu, Orders, Menu setup)
- API: http://localhost:3000/api/v1, Swagger UI at http://localhost:3000/docs
- Server settings are optional; defaults live in [`apps/server/.env.example`](apps/server/.env.example).

The server keeps everything in memory and seeds about 1,500 items in 17 categories on every start.

| Command          | What it does                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm test`      | Unit tests (Vitest)                                                                                  |
| `pnpm e2e`       | Playwright end-to-end tests; starts both apps unless they run                                        |
| `pnpm lint`      | ESLint                                                                                               |
| `pnpm typecheck` | TypeScript, strict mode                                                                              |
| `pnpm analyze`   | Client production build and a bundle treemap, opened in the browser (`dist/apps/client/bundle.html`) |
| `pnpm build`     | Production builds                                                                                    |
| `pnpm verify`    | typecheck, lint, test and build in one go                                                            |

CI (GitHub Actions) runs typecheck, lint, format check, tests and builds, then the e2e suite once those pass.

## How the requirements are met

| Requirement                                     | Mechanism                                                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Changes are reflected in Menu immediately       | Every write bumps a menu revision and goes out over SSE; open tabs apply it as a delta.                                                                                              |
| Browse a large menu                             | CDK virtual scroll under the window scroll, search, category chips that follow the scroll.                                                                                           |
| Open-price items                                | The price is entered in a dialog that follows the live item: if the item becomes fixed-price or sells out while the dialog is open, the dialog changes with it.                      |
| An order is never placed twice                  | `exhaustMap` ignores clicks while a checkout is in flight; every cart payload carries an `Idempotency-Key`, a lost response is retried with the same key and returns the same order. |
| Availability changes before confirming          | Cart lines show live warnings as the menu changes; the server re-checks every line and answers 409 with a list of changes, the client reconciles the cart and asks to confirm.       |
| Order statuses update in real time              | A separate orders stream; the kitchen is simulated by server timers.                                                                                                                 |
| Errors and lost connections don't break the app | Toasts with readable messages, the cart survives failures, SSE reconnects and resumes from the last revision, an offline banner, and statuses marked “as of HH:MM” while offline.    |

All of these are covered by Playwright tests in [`apps/client-e2e`](apps/client-e2e).

## Architecture

```
apps/
  client          Angular app shell and routes
  client-e2e      Playwright tests with page objects
  server          NestJS bootstrap and config
libs/
  shared/*        Pure TypeScript shared by both sides: money, limits, the checkout line check, order totals
  server/*        NestJS modules: menu, orders, the kitchen simulator, SSE plumbing
  web/
    common/*      Generic helpers with no business logic: zod parsing, forms, money, RxJS operators, the live sync store feature
    infrastructure/*  Transport only: HTTP setup, the generated REST client, EventSource
    core/*        Domain data shared across features: models, API adapters, MenuStore
    ui/*          Reusable components: form fields, toast, confirm dialog, highlight, icons
    modules/*     Features: scoped business logic with its UI and stores — menu (guest menu and cart), orders, menu-setup, shell
```

Rules the layout follows: `infrastructure` only talks to the network; anything generic without business meaning goes to `common`; a store that belongs to one feature lives in that feature's module, `core` only holds what several features share.

## Key decisions and trade-offs

**SSE instead of WebSockets.** Updates only flow from the server; the client's actions are plain REST calls. SSE gives reconnection and `Last-Event-ID` for free and works through ordinary HTTP infrastructure.

**Snapshot + revisioned stream.** A store loads a snapshot with its revision, then opens the stream from that revision. After a reconnect the stream either replays what was missed or asks for a `resync`, and the store reloads the snapshot in the background without a loading state. This is written once, as the `withLiveSync` SignalStore feature, and used by both `MenuStore` and the orders store; menu and orders have separate revisions.

**Own writes vs. remote changes.** A write's response is applied right away if it is newer than what the stream has delivered, and its revision is remembered, so the echo from the stream is recognised as our own. Only changes made elsewhere get highlighted.

**Flat menu payload.** `GET /menu` returns `{ categories, items }` with `item.categoryId`, not nested categories. The store is normalized by id, SSE deltas are per item (moving an item is just a new `categoryId`), and the virtual list needs one flat row list anyway. Grouping is a single computed over the store.

**NgRx SignalStore.** It meets the “NgRx or NGXS” requirement without classic action/reducer/effect boilerplate. Writes go through feature-level stores with `concatMapBy` (edits of one entity in order, different entities in parallel) and `exhaustMapBy` (deletes) instead of a store per row: a row-scoped store would be destroyed on re-render and cancel its in-flight save. Writes never use `switchMap`: cancelling a request only drops the answer, the server may still apply it.

**A generated, validated API client.** The Angular client is generated by orval from the server's OpenAPI spec. Domain adapters (`MenuApi`, `OrdersApi`) wrap it and parse every response with zod, so stores never see raw DTOs. The checkout rule (what changed in a line) and the order totals live in `libs/shared/orders` and are used by both the cart and the server, so the warning in the cart and the server's 409 can't drift apart.

**Money in integer cents** everywhere; formatting happens only at the edges.

**Material and CDK for behaviour, a custom look.** Dialogs, bottom sheet, virtual scroll and a11y come from Material/CDK; the theme follows the mockups in [`context/lab/custom`](context/lab/custom). On the menu page, dialogs use the noop scroll strategy: the default one resets the window scroll and the virtual list would render the wrong rows.

**Menu setup is master–detail.** The selected category's items are a real `<table>` without virtualization (CDK virtual scroll breaks table layout). With up to ~160 items per category that is about 3,600 DOM nodes and ~60 ms per toggle. A single table of all 1,500 items measured ~40k nodes and ~160 ms per toggle, which is why the screen is split by category.

**Testing.** Vitest unit tests for the stores, operators and shared logic; Playwright for the user flows. The server is covered only through the e2e suite.

## Performance

Production build: about 102 KB of JavaScript and CSS over the network for the first load; features load as lazy chunks of 12–41 KB (`pnpm analyze` shows what's inside).

**How it was measured.** With a small Playwright script against the production build in Chromium: timings from the browser's Performance API, “low-end” emulated through Chrome DevTools (4× slower CPU, slow 4G), median of three runs.

|                                  | Transferred | First paint | Menu on screen | Layout shift | Blocking time | “Add” responds in |
| -------------------------------- | ----------- | ----------- | -------------- | ------------ | ------------- | ----------------- |
| Desktop                          | 585 KB      | 76 ms       | 0.13 s         | 0            | 0 ms          | 59 ms             |
| Low-end                          | 585 KB      | 2.0 s       | 4.0 s          | 0            | 40 ms         | 98 ms             |
| Low-end, gzip at a reverse proxy | 330 KB      | 2.0 s       | 3.0 s          | 0            | 53 ms         | 103 ms            |

Most of the transfer is the menu snapshot: 302 KB as JSON, 49 KB gzipped. The server doesn't compress responses itself; in production that belongs to the reverse proxy (see below). An icon font that weighed 315 KB for four icons was replaced with inline SVG.

## What was simplified

- **Storage.** The server keeps everything in memory and reseeds on start.
- **No users or auth.** Everyone sees all orders; the kitchen is simulated by timers (12, 40 and 70 seconds after placing an order).
- **Menu order** is insertion order; there is no sorting or drag and drop, and items can't be moved between categories. A category with items can't be deleted (409) until its items are removed.
- **The cart lives in memory**, so a page reload empties it.
- **No response compression on the server** (see Performance).
- **Silent connection drops.** A stream can die without either side noticing: the laptop wakes from sleep, the phone switches networks, a proxy forgets an idle connection. The browser still thinks the stream is open, so there is no error and no `offline` event; the page keeps showing “Live” while updates quietly stop, until TCP gives up minutes later. Checkout stays safe, because the server re-checks the cart. The server's 15-second heartbeat doesn't catch this: it is an SSE comment (`:heartbeat`), which keeps proxies from closing a quiet stream but never reaches the page's JavaScript. The fix would be a named `ping` event and a client timer that reopens the stream after a few silent intervals.
- **Two dev-only audit findings** (`braces`, `sprintf-js`) come from build tooling and have no upstream fix yet.

## What production would need

- **HTTP/2 on the origin that serves the API and the streams.** Over HTTP/1.1 a browser opens at most six connections per origin, and every tab keeps one or two SSE streams open, so with a few tabs the regular requests start to queue. You can see this in development, which runs on HTTP/1.1: once about six streams are open (six menu tabs, or three on the orders page), new requests to the API stall. HTTP/2 carries all tabs over one connection with about a hundred concurrent streams. The client code doesn't change; the browser negotiates the protocol itself.
- **A reverse proxy** in front of the server: TLS, HTTP/2, gzip or brotli for JSON (but not for `text/event-stream`), static files for the client, and buffering turned off for the streams.
- **A real backend:** a database, a persistent event log so streams resume across restarts, idempotency keys with a TTL, and a shared event bus once there is more than one server instance.
- **Auth** for menu setup and per-guest orders. EventSource can't send custom headers, so the session would go in a cookie.
- **A real kitchen side** moving order statuses through an API instead of the simulator.
- **Faster first paint on slow networks:** preloading the two text fonts and prerendering the app shell.
- **Observability:** structured logs, error reporting on the client, metrics on stream connections.
