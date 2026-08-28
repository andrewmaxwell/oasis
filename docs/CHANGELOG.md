# Changelog

## 2026-08-28 — A transactional order snapshot

**Creating an order was three inserts, and a retry double-counted the diapers.**
(ISSUES #13, #14) `NewOrderPage` inserted `order_record`, then `order_parent` and
`order_kid` in a `Promise.all`. Two failures came out of that shape. If either of
the latter two calls failed, the `order_record` was already committed, and the
user was navigated into a half-populated order that looked complete — the
families or children that never landed were simply invisible, and the totals
were wrong with nothing on screen to say so. And because `order_parent` and
`order_kid` had no primary key, only nullable foreign keys, a retry appended a
second copy of every row rather than conflicting: a double-tap or a network
retry doubled the order this org places its real diaper order against.

Both are closed by `20260828000003`. `order_parent` and `order_kid` get composite
primary keys — `(order_id, parent_id)` and `(order_id, kid_id)` — after the
migration de-duplicates anything already written that way, and the whole snapshot
moves into one `create_order` Postgres function called through `supabase.rpc()`.
It commits or it does not, so the error toast can now say "Nothing was saved"
instead of telling the user to go check the Orders list by hand. A retry mints a
fresh `order_id`, so the worst a repeated submit can do is create a second order
— wrong, but visible in the Orders list rather than hidden inside the totals of
an existing one.

The function is `SECURITY INVOKER`, so the existing RLS policies on all three
tables still gate what it writes — it grants no ability a `readOnly` account did
not already have. It takes the rows the client already computed rather than
rebuilding the roster in SQL, deliberately: the diaper-quantity rule lives in
`utils/calcDiaperSizes.ts` and is unit-tested there, and a SQL reimplementation
would be a second source of truth for the one number the entire order is measured
by. Atomicity is what it adds, not a second opinion.

The E2E mock reimplements `create_order` alongside the views, including the
primary-key conflict, since the app now depends on a function that Postgres would
otherwise be the only thing to provide.

**`supabase.rpc` was accepting anything, and so was every other typed call.**
Wiring up the new call surfaced why: supabase-js's `GenericTable` and
`GenericView` both require a `Relationships` field, and `types.ts` declared none
— so `Database` failed to satisfy `GenericSchema`, the client's `Schema` resolved
to `never`, and every typed call silently degraded to accepting any argument.
Adding `Relationships: []` to each entry turned real checking back on, which
promptly found five things `types.ts` had wrong: `is_deleted` was missing from
`parent`, `kid`, `deliverer`, and `order_record`, and the `order_id`, `kid_id`,
and `parent_id` that `finished_order_view`, `kid_order_view`, and
`parent_order_view` are each *filtered by* were absent from their row types. Every
one of those queries had been running against a type that did not admit the column
it filters on. `create_order`'s arguments are now genuinely typechecked — verified
by mutation — while `from()` stays `any` (ISSUES #37).

## 2026-08-28 — Mobile layout and list ordering

### The app on a phone

**The table header was being sliced off by the column headers.** (ISSUES #30)
`OasisTable` put its title, count, search box, and Add button in the `DataGrid`'s
`toolbar` slot, which has a fixed height and clips whatever spills past it. On a
desktop the row fits on one line; on a phone it wraps, and everything past the
first line disappeared under the grid — including the only way to add a family.
The header moved out of the slot into `OasisTable`'s own markup, which means the
quick filter is now driven through the grid's `filterModel` rather than
`<QuickFilter>`.

**Every table was a sideways-scroll maze.** (ISSUES #30) Columns are fixed pixel
widths adding up to ~1,500 px. Below the `sm` breakpoint a table now shows only
the fields in its new `mobileColumns` prop — defaulting to the first two —
flexed to fill the viewport with wrapping cells. Quick filter still searches the
hidden columns (the grid excludes them by default), so a family is still findable
by zip or phone from a car, and inactive rows are dimmed, since the "Active" chip
is one of the columns a phone hides.

**The rest of the mobile pass.** The seven-column tables on the finished-order
page scroll inside a `TableContainer` instead of widening the page, and that
page's action buttons stack instead of overflowing. The label sheet — physically
8.5in wide — zooms to fit the viewport on screen, leaving print at true size. The
sign-in form, which renders outside the router's `Container` and so had no
padding at all, got a page of its own. Added `theme-color` so the phone browser's
chrome matches the app.

### List ordering

**Ordering moved into the database, and two views were wrong.** (ISSUES #47)
`parent_view` already sorted active-first-then-alphabetically; `kid_view` sorted
by birth date, scattering children who had aged out through the roster staff work
from every month. Worse, `deliverer_options` sorted `is_active` ASC — false
before true in Postgres — so every retired volunteer was listed *above* the
active ones in the family form's "Planned Deliverer" dropdown. Both fixed in
`20260828000002`. The three pages that sorted their fetched arrays by hand now
pass a `SortSpec[]` to `getAllRecords` instead, so ordering lives in one place;
the E2E mock learned `order=` to match.

### Testing

`e2e/mobile.spec.ts` runs the roster at 390 px and pins the header controls being
wholly on screen, the page not overflowing sideways, and search still reaching
hidden columns. `e2e/ordering.spec.ts` pins active-before-inactive on the kids
list, the deliverers list, and the deliverer dropdown, with fixtures seeded out of
order so insertion order alone cannot pass it.

---

## 2026-08-27 – 2026-08-28

Sixteen commits over two days, taking the app from a working prototype with a
critical auth hole and no tests to a hardened, tested, and current codebase. CI
now runs six checks — lint, typecheck, unit tests, E2E, edge-function typecheck,
and build — all green.

---

### Security & access control

**Fixed a critical privilege-escalation hole in user management.** (`062a532`)
The `user-management` edge function held the service role key but never
authorized its caller: it read `action` from the request body and called
`supabase.auth.admin[action](...args)` directly. Supabase's default `verify_jwt`
only proves the token was signed by the project, and the anon key — which ships
inside the public bundle — satisfies that. Anyone who opened DevTools on the
deployed site could dump every account, grant themselves admin, change any
user's password, or delete accounts. The function now verifies the bearer token,
requires `admin`, dispatches through an explicit handler allow-list, validates
ids/emails/levels server-side, restricts CORS to an allow-list, and refuses
self-demotion and self-deletion so an admin always remains.

**Moved `access_level` from `user_metadata` to `app_metadata`.** (`062a532`)
Users can write their own `user_metadata` via `supabase.auth.updateUser({data})`,
so an authorized endpoint would still have accepted a self-granted admin claim.
`app_metadata` is writable only with the service role key. Migration copies
existing levels across; `toAppUser` has a regression test asserting a conflicting
`user_metadata` level loses.

**Replaced the blanket RLS policy with real per-operation policies.**
(`062a532`) `TO authenticated USING (true)` became reads gated on
`app_can_read()` and writes on `app_can_write()`. `app_access_level()` reads the
JWT claim and falls back to `auth.users`, so stale tokens resolve correctly and
an account with no assigned level gets nothing. Schema changes now go through
`supabase/migrations/` instead of hand-application in the SQL editor.

**Invited users get no password at all.** (`062a532`) `createUser({password:
'abcdefg'})` is gone; the invite link is now the only way in, and invite/recovery
arrivals route to the password form.

**Closed public signup and verified the deployment.** (`db43a28`) Live chunks
confirmed byte-identical to a local build of the same commit.

---

### Data correctness

**`parent_order_view` silently dropped families from historical orders.**
(`ba6212a`) The view evaluated `NOT ok.is_deleted` in `WHERE` against a
LEFT JOINed `order_kid`, so any row where `ok` was NULL failed the predicate —
collapsing the outer join to an inner one. A family in an order whose
`order_kid` rows were all soft-deleted vanished from the record entirely, which
is the one thing the order snapshot exists to prevent. Predicate moved into the
`ON` clause.

**Soft deletes were dropped by the realtime subscription.** (`b7e6805`,
ISSUES #7) A soft delete arrives as an UPDATE setting `is_deleted`, and the
UPDATE branch patched the row in place — so a family deleted in another tab
stayed in the list and could still be snapshotted into a new order.

**Dashboard counts didn't match their labels.** (`b7e6805`, ISSUES #8)
`getTableCount` filtered `is_deleted` but not `is_active` while the dashboard
labelled the results "Active Families/Kids/Deliverers". The numbers will drop.

**`finishOrder` can no longer orphan an order.** (`516966c`) It checks for
eligible families before creating the `order_record`, so an empty roster leaves
nothing behind.

**Three smaller fixes.** (`b7e6805`) `LabelPage` sorted an array straight out of
state (#16); `new Date(null)` is the 1970 epoch, so a missing birth date always
tested as over three years ago and rendered blank in error red (#18); the
parents table showed "(undefined active parents…)" while loading (#21).

**`dataModel.sql` now runs top-to-bottom.** (`2bfb151`, ISSUES #10/#11) Trailing
comma in `order_kid` dropped, DROPs grouped in reverse dependency order,
`deliverer` created before the `parent` table that references it.

---

### Error handling, feedback & data layer

**Full error/loading/feedback layer on TanStack Query.** (`516966c`, ROADMAP §2)
Every read hook is a `useQuery`, every write a `useMutation` that invalidates the
keys it affected, with keys living only in `src/queryClient.ts`. Realtime patches
the query cache rather than component state. Select options became a named
`OptionSource` keyed in the cache — a new deliverer now appears in the parent
form immediately — dropping the `memoizee` dependency.

On top of that: `ToastProvider`/`useToast` (successes auto-hide, errors persist),
promise-based `ConfirmProvider`/`useConfirm`, an `ErrorBoundary` around the
router replacing the blank page on a render throw, and `PageStates`
(`ErrorState` with retry, `FormSkeleton`, `EmptyState`). `alert()` and
`confirm()` no longer appear anywhere in `src/`.

`log()` became `fail()`: logs and throws, which is what lets `useQuery` retry and
`useMutation` reach `onError`. `getRecord` throws on a missing id instead of
returning `undefined` — the other path to a spinner that never resolved. Sign-in
and password-update failures now surface instead of failing silently.

**Unsaved edits are no longer discarded silently.** (`2bfb151`, ISSUES #26)
`useUnsavedChangesPrompt` wires react-hook-form's `isDirty` to react-router's
`useBlocker` through the existing confirm dialog, plus a `beforeunload` handler
for tab close and reload. `allowNextNavigation()` suppresses the prompt for
exactly one navigation, since pages navigate themselves after a save while the
form is still dirty.

---

### Testing

**Playwright smoke test over the core order flow.** (`c53a5da`, ROADMAP §6.3)
Sign in → add a family → add a child → create the monthly order → verify the
frozen totals, across five routes and a post-save redirect. Supabase is mocked at
the network boundary — no Docker, no test project, no secrets, identical on a
laptop and in CI — and the mock throws on any query outside the PostgREST subset
the app actually uses. Verified by mutation: changing size 1's diaper quantity
and breaking the `/kid/:id` route each fail the suite.

Guards against reaching a real database, because the first run proved it can: the
dev server picked up the developer's `.env` and issued a live auth request to
production. It now runs on its own port against `.env.e2e` placeholders, never
reuses an existing dev server, and a catch-all route fails the test on any
unmocked external request.

**Vitest coverage for `src/utils`.** (`363da47`, ISSUES #35/#36) 46 tests, one
file per util — the diaper-size table asserted size by size, the invariant that
a snapshotted `diaper_quantity` is trusted over the current lookup,
`getDifference`'s reference-vs-value comparison, and ISSUES #1 as a regression
test. CI test step added.

**17 `OasisForm` tests.** (`ba6212a`, ROADMAP §6.2) jsdom + React Testing
Library, covering field rendering, required-field validation, the
dirty/submitting Save button, `OptionSource` cache sharing, and every branch of
the unsaved-changes blocker. `vitest.config.ts` merges the Vite config rather
than copying it; `globals: true` is load-bearing (RTL registers its cleanup only
when the globals exist).

---

### Dependencies & tooling

**ESLint 9 → 10, swapping `eslint-plugin-react` for `@eslint-react`.**
(`fcfe32a`) The old plugin was the single blocker — its latest release still caps
at `eslint@^9.7`. The new rules paid for themselves immediately: core
`preserve-caught-error` caught the edge function rethrowing an invite failure
without `cause`, and five React 19 modernizations were applied (`<Context>` over
`<Context.Provider>`, `use()` over `useContext()`).

**Vite 7 → 8 (Rolldown) and MUI 7 → 9, x-data-grid 8 → 9.** (`7b0ad2a`) Vite
needed no source changes. MUI 9 removed the system shorthand props (`mb`, `pb`,
`fontWeight`, `alignItems`) from Box/Typography/Grid — 18 sites across 11 files
moved into `sx`. Since types can't catch a visual regression, this was verified
by screenshotting eight pages on both versions: five byte-identical, three
differing only in antialiasing.

**All in-range dependencies updated; `npm audit` 15 → 0 vulnerabilities.**
(`768749f`, `6986c65`, `7b0ad2a`) Includes react-router-dom 7.18.2 for the
high-severity advisories — practical exposure here was near nil (every advisory
targets a server-side vector; this is a client-only hash-router SPA) but the tree
is clean now.

**Two latent config bugs surfaced by the update.** (`768749f`) `tsconfig.lib`
listed `ESNext.Array`, `DOM`, and `DOM.Iterable` but no core ES library — `lib`
*replaces* the target default rather than adding to it, so every global type was
unresolved, and it only ever passed because a transitive `@types` package pulled
the core lib in. `@types/node` was likewise only transitive and `npm update`
dropped it, breaking `process.env` in `playwright.config.ts`. Both now explicit.

**`npm run check:functions`.** (`062a532`) `tsconfig` scopes to `src/`, so the
Deno edge function was never typechecked; adding `deno check` immediately caught
an undefined identifier and seven type errors. Wired into CI along with `npm ci`,
lint, and typecheck.

**Dev server pinned to :5173 with `--strictPort`.** (`2f86cad`) Vite's silent
fallback to 5174 breaks `/users` specifically — the only page calling the edge
function directly, whose CORS allow-list covers 5173 only — so it fails with
"Failed to fetch" while every other page works. 5174 is also reserved for
Playwright.

**Housekeeping.** (`4a6f0af`) `.env.example` committed, `npm run format`,
`engines: node >=22`, `.nvmrc`, version 1.0.0. Prettier's options moved out of
the ESLint rule into `.prettierrc.json` so the CLI, editor, and lint can't
disagree.

---

### UI & accessibility

**App navigation.** (`1dd3ed8`, ISSUES #24) `OasisNav` renders
Dashboard/Families/Kids/Deliverers/Orders — plus Users for admins — as AppBar
links at md and up, a Drawer below. Detail routes highlight their section, so
`/parent/:id` lights up Families.

**A real theme file.** (`1dd3ed8`, ROADMAP §10) `theme.ts` takes palette, shape,
and component defaults over from the one-line `createTheme`. Button labels are no
longer uppercased. Stat cards drop their hardcoded hex colors and the
`` `${color}20` `` alpha-by-string-concat hack for palette tokens and `alpha()`,
which is what makes a light/dark switch possible later.

**Link colors.** (`4a6f0af`, ISSUES #29) `linkButton`, `anchor`, and `mapAnchor`
used bare `<Link>`/`<a>`, so every link in every table rendered browser-default
blue turning visited-purple against the dark theme. All three use MUI `<Link>`
now, with a theme default supplying hover underline and a focus-visible ring.

**Save button accessible name.** (`4a6f0af`, ISSUES #45) The button swapped its
label for a bare `<CircularProgress>` while saving, leaving it nameless for the
length of the save. It now reads "Saving…" with the spinner as an `aria-hidden`
`startIcon`.

**Toolbar title is focusable.** (`1dd3ed8`, ISSUES #32) The logo and title are
one `Link`, replacing an `onClick` on a `Typography` that was neither focusable
nor visible to screen readers.

**MUI out-of-range warnings on selects.** (`8843b79`) A record loaded from
Postgres has `null` for an unset column and a blank record omits the key
entirely, so an untouched select matched no option and MUI logged "You have
provided an out-of-range value" on every render. Fixed once in `OasisSelect` by
coercing to `''` at render — which leaves react-hook-form's own value alone, so
the dirty check and `getDifference` are unaffected — superseding the
`deliverer_id || ''` workaround that patched the same bug one field at a time.
Also (`b7e6805`, #22): every select opened with a valueless, zero-height blank
`MenuItem`.

---

### Documentation

`CLAUDE.md` written from scratch (`062a532`) and kept current with each change.
`docs/ISSUES.md` condensed 491 → 245 lines and `ROADMAP.md` 214 → 165
(`363da47`), collapsing fixed issues into a ledger that keeps their numbers since
other docs cite them. `docs/SECURITY-FIX-DEPLOY.md` records deployment state,
including why the first Pages deploy failed — the repo had been made private,
which disables GitHub Pages (`db43a28`). ISSUES #46 documents the two majors
still blocked upstream (TypeScript 7, via typescript-eslint) with evidence rather
than a peer range.
