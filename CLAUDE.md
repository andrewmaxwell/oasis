# CLAUDE.md — Oasis Diaper Ministry Manager

Steering file for AI assistants and new contributors. Read this before making changes.

> **Companion docs:** [docs/ISSUES.md](docs/ISSUES.md) (known defects, prioritized) ·
> [docs/ROADMAP.md](docs/ROADMAP.md) (enhancements toward modern best practices & better UX)

---

## 1. What this app is

Oasis is an internal admin tool for a non-profit that distributes diapers to refugee
families. A handful of staff and volunteers use it to:

1. Maintain a roster of **families** (`parent`) and their **children** (`kid`, each with a
   diaper size), plus the **volunteers** who deliver to them (`deliverer`).
2. Once a month, snapshot that roster into an **order** (`order_record`) — freezing which
   families, which kids, which diaper sizes, and which deliverer, so the historical record
   isn't rewritten when the roster changes later.
3. Produce the operational outputs: per-size diaper totals, per-zip and per-deliverer
   breakdowns, printable 4"×2" address labels, and pre-filled `mailto:` emails to
   deliverers.

**Audience reality check:** users are non-technical volunteers, often on phones or tablets,
sometimes in a car mid-delivery. The data is PII about refugee families — names, addresses,
phone numbers, country of origin, and estimated household income. Both facts should drive
design decisions.

## 2. Stack

| Layer | Choice |
| --- | --- |
| Build | Vite 7, TypeScript 5.9 (strict), ESM |
| UI | React 19, MUI 7 (`@mui/material`, `@mui/x-data-grid` v8), Emotion |
| Routing | `react-router-dom` 7, **hash router** (`createHashRouter`) |
| Forms | `react-hook-form` 7 |
| Server state | TanStack Query 5 (`@tanstack/react-query`) |
| Backend | Supabase (Postgres + Auth + Realtime + Edge Functions/Deno) |
| Hosting | GitHub Pages via GitHub Actions, served under `/oasis/` |
| Lint | ESLint 9 flat config + Prettier (`singleQuote`, `bracketSpacing: false`) |

`base: '/oasis/'` in [vite.config.ts](vite.config.ts) and the hash router exist **because of
GitHub Pages** — it can't do SPA server-side rewrites. Don't switch to `createBrowserRouter`
without also changing hosting.

## 3. Repo layout

```
src/
  main.tsx                 Root render; MUI dark theme + CssBaseline
  App.tsx                  Route table (lazy-loaded), session gate
  supabase.ts              THE ONLY module that talks to Supabase. All queries live here.
  types.ts                 Hand-written DB row/insert/update types + form field types
  queryClient.ts           The QueryClient and the `queryKeys` map — the only place keys live
  hooks/                   One hook per data-loading concern (useParent, useKid, useTable…)
  components/
    Oasis*.tsx             The shared design-system layer (Form, Table, TextField, Select, Switch)
    cellRenderers.tsx      DataGrid cell renderers (links, chips, map/tel/mailto anchors)
    pages/                 One file per route; each default-exports its page component
  utils/                   Pure functions only, individually testable
supabase/
  functions/user-management/index.ts   Deno edge fn wrapping supabase.auth.admin.*
dataModel.sql              Schema + views (hand-applied; NOT a migration system)
scripts/                   One-off Node scripts: fake data, prod import, policy generation
```

## 4. Architecture, in the order data flows

### Data access
Every Supabase call goes through [src/supabase.ts](src/supabase.ts). Pages and hooks never
import `createClient`. Keep it that way — it's the single seam for adding typed clients later.

Above that seam sits **TanStack Query**. Reads are `useQuery` (wrapped in a hook under
`src/hooks/`), writes are `useMutation` in the page. The rule that makes this work: a
mutation invalidates the keys it affected, and **every key comes from `queryKeys` in
[src/queryClient.ts](src/queryClient.ts)** — never an inline array, or the invalidation
silently misses. Defaults are 30 s `staleTime`, two retries with backoff, and
refetch-on-focus.

Two families of read helpers:
- `getAllRecords` / `getRecord` / `getTableCount` — raw tables, always filtered by
  `is_deleted = false`.
- `getView('some_view')` and the specific `get*Orders` helpers — read from SQL **views**
  that pre-join and pre-aggregate. Views end in `_view` or `_options`.

### Soft deletes
Nothing is ever hard-deleted from the UI. `softDelete()` sets `is_deleted = true`. Every
read path must filter it out. `hardDelete()` exists but is unused — leave it that way.

The confirm dialogs say "This cannot be undone," which is **not true** and is listed as a
UX defect in ISSUES.md.

### The orders snapshot
This is the core domain concept and the easiest thing to break.

- `order_record` — the order itself (date of order, date of pickup, notes).
- `order_parent` — which families were in it, and **who was assigned to deliver**, copied
  from `parent.deliverer_id` at snapshot time.
- `order_kid` — one row per child, with `diaper_size` and `diaper_quantity` **copied** at
  snapshot time.

Quantities come from a fixed lookup in [src/utils/calcDiaperSizes.ts](src/utils/calcDiaperSizes.ts):
sizes P/N/1 → 75 diapers, sizes 2–7 → 50. Changing a kid's size later must not alter a past
order. That's why the values are denormalized into `order_kid` rather than joined.

Snapshot creation lives in `finishOrder` in
[NewOrderPage.tsx](src/components/pages/NewOrderPage/NewOrderPage.tsx#L28-L71). It only
includes active parents who have at least one active kid.

### Errors, loading, and feedback
There is no `alert()` and no `confirm()` in `src/`, and adding one back is a regression.

- **Failures.** `fail()` in `supabase.ts` logs and throws. react-query catches the rejection,
  retries, and the page renders `<ErrorState>` from
  [PageStates.tsx](src/components/PageStates.tsx) — message plus Retry. Mutations report
  through `onError` → error toast.
- **Messages.** `useToast()` ([hooks/useToast.ts](src/hooks/useToast.ts)). Successes
  auto-hide; errors stay until dismissed. One optional inline action per toast.
- **Confirmations.** `useConfirm()` ([hooks/useConfirm.ts](src/hooks/useConfirm.ts)) returns
  a promise. Soft-delete copy must not claim the action is permanent — it isn't.
- **Loading.** `FormSkeleton` / `BlockSkeleton`, not `<CircularProgress />`. `OasisTable`
  takes `emptyMessage`, `error`, and `onRetry`.
- **Render throws** hit `<ErrorBoundary>` in [main.tsx](src/main.tsx).

### Forms
`OasisForm` is a declarative renderer. A page defines a module-level
`FormField<T>[]` array (`id`, `label`, `type`, `width` in a 12-col grid, `options`,
`required`, `multiline`) and `OasisForm` maps each to `OasisTextField` / `OasisSelect` /
`OasisSwitch`. Adding a field to a form = adding one object to that array.

Field arrays must stay **module-level constants**, and so must the `origData` object for a
*new* record — `OasisForm` passes it to react-hook-form's `values`, which resets the form
whenever that reference changes. The blank records in `useParent` / `useKid` etc. are
`useMemo`'d for exactly this reason.

Async select options are an `OptionSource` — `{key, load}` — not a bare function. The `key`
is the query-cache key, so two fields sharing a source share one fetch and a mutation can
invalidate it by name.

Updates send only changed keys via `getDifference(formData, original)`.

Submitting goes through a mutation, which returns immediately, so react-hook-form's own
`isSubmitting` is useless for keeping Save disabled — pass `submitting={mutation.isPending}`
instead.

### Tables
`OasisTable` wraps MUI `DataGrid` with a custom toolbar (title, count subtitle, quick
filter, and a write-gated "Add" button). Columns are `GridColDef` arrays, also module-level.
Cell rendering is shared through `cellRenderers.tsx`.

### Auth & permissions
Three levels — `readOnly`, `readWrite`, `admin` — stored in Supabase
**`app_metadata.access_level`**. Read via `useCanWrite()` / `useIsAdmin()` in
[src/hooks/useAccessLevel.ts](src/hooks/useAccessLevel.ts).

> **Never move this to `user_metadata`.** Users can write their own `user_metadata` through
> `supabase.auth.updateUser({data})`, so a level stored there can be self-granted — that was
> the original bug (ISSUES.md #1). `app_metadata` is writable only with the service role key,
> which lives solely in the edge function.

Enforcement happens in three places, and the client hooks are the *least* important of them:

1. **RLS policies** — `SELECT` gated on `public.app_can_read()`, writes on
   `public.app_can_write()`. `public.app_access_level()` reads the JWT's `app_metadata` claim
   and falls back to `auth.users`, so stale tokens resolve correctly and an account with no
   assigned level gets nothing. Generated by `scripts/generateTriggersAndPolicies.js`.
2. **The user-management edge function** — verifies the bearer token and requires `admin`.
3. **`useCanWrite()` / `useIsAdmin()`** — UI affordances (hide buttons, disable forms) only.

Treat #3 as cosmetic. If you add a write path, the policy in #1 is what actually protects it.

### Realtime
`useTable` subscribes to Postgres changes and patches the **query cache** (`setQueryData`),
not component state. It's used only by the new-order flow. It handles soft deletes: an
`UPDATE` setting `is_deleted` drops the row.

### Database schema
[dataModel.sql](dataModel.sql) is the source of truth, applied by hand in the Supabase SQL
editor. There is no migration tool and no generated types — `types.ts` is maintained
manually and **will drift**. Triggers, RLS policies, and grants aren't in that file; they're
printed by `node scripts/generateTriggersAndPolicies.js` and pasted in.

The file does not currently run top-to-bottom without edits (ISSUES.md #10, #11).

## 5. Conventions

- **Components:** arrow functions assigned to a `const`, typed via a local `type XProps = {…}`.
  Pages `export default` (needed for `React.lazy`); shared components use named exports.
- **Imports:** relative, with explicit `.ts` / `.tsx` extensions in most files. Be consistent
  with the file you're editing.
- **Formatting:** Prettier via ESLint. Single quotes, no bracket spacing (`{foo}` not `{ foo }`).
  Run `npm run lint` before committing.
- **Styling:** MUI `sx` prop. No CSS files. The only global CSS is in
  [index.html](index.html) and the injected print styles in `LabelPage`.
- **Utils:** pure, single-purpose, one export per file.
- **Naming:** DB columns are `snake_case` and that leaks all the way into React props and
  types (`first_name`, `is_active`). This is intentional — don't introduce a mapping layer
  for one field.
- **New route:** add an entry to `routeMap` in [src/App.tsx](src/App.tsx) and create the page
  with a default export. Routes get the toolbar and container automatically; `/labels/:id` is
  deliberately outside that wrapper so it can render bare pages for printing.

## 6. Commands

```bash
npm run dev        # Vite dev server on :5173
npm run build      # tsc --noEmit then vite build
npm run preview    # serve dist/
npm run lint       # eslint .
```

```bash
npm run typecheck        # tsc --noEmit
npm run check:functions  # deno check on supabase/functions — see below
```

**`npm run check:functions` is not optional.** `tsconfig.json` scopes to `["src"]`, so the
Deno edge function is invisible to `tsc`, and ESLint's `no-undef` is off for TypeScript. An
undefined identifier in that file will otherwise build, lint, and deploy cleanly and only
fail at runtime. CI runs all four checks.

No test runner is configured. Lint, typecheck, functions check, and build all pass clean —
keep them that way.

Environment: copy the template in the README into `.env`:
```
VITE_SUPABASE_URL=…
VITE_SUPABASE_KEY=…   # anon/public key ONLY, never the service role key
```
These are baked into the client bundle at build time and are public by design. CI injects
them from repo secrets.

Edge function deploy: `npx supabase functions deploy` (needs the Deno VS Code extension for
editing — see [.vscode/extensions.json](.vscode/extensions.json)).

## 7. Gotchas — read before debugging

1. **Schema changes go through `supabase/migrations/`**, not the SQL editor. `npx supabase
   db push` applies them. The RLS policy migrations are *generated* — edit
   `scripts/generateTriggersAndPolicies.js` and regenerate, never hand-edit the SQL.
   `dataModel.sql` is NOT a migration and still contains `DROP TABLE … CASCADE`; never run it
   against production. Status of the security work is in
   [docs/SECURITY-FIX-DEPLOY.md](docs/SECURITY-FIX-DEPLOY.md).
2. **Errors throw; react-query catches them.** `fail()` in `src/supabase.ts` logs and throws.
   That's deliberate — a rejected promise is how `useQuery` knows to retry and how
   `useMutation` reaches its `onError`. Don't "fix" it by returning an error object.
   `userManagement` is the exception: the edge function returns `{error}` rather than
   rejecting, so the hooks that call it re-throw (`if (fnError) throw new Error(fnError)`).
   Anything new calling it must do the same or the failure disappears.
3. **Session state is one shared store, not per-component.** `useSession` /
   `useSessionState` in [src/hooks/useSession.ts](src/hooks/useSession.ts) read a
   module-level store via `useSyncExternalStore`, populated once at import. Use the `loaded`
   flag to tell "logged out" from "not yet known" — gating on `session` alone reintroduces
   the sign-in / "Access Denied" / disabled-form flash.
4. **Invited users have no password.** The invite link is the only way in, and
   [App.tsx](src/App.tsx) routes `type=invite` / `type=recovery` arrivals to
   `/changePassword`. The fragment is captured at the top of `supabase.ts` *before*
   `createClient`, because supabase-js clears it as soon as the client initializes — and
   because this app uses a *hash* router, so Supabase's `#access_token=...` also collides
   with the route.
5. **There is an error boundary now**, wrapping the router in
   [main.tsx](src/main.tsx) — a render-time throw shows "Something went wrong / Reload"
   rather than a blank page. There's also a `path: '*'` route for unmatched URLs. Note the
   toast and confirm providers sit *outside* the boundary, so a message survives the failure
   that produced it.
6. **Typing is largely fictional past the client boundary.** `from()` in
   [supabase.ts:52](src/supabase.ts#L52) casts to `any`; call sites use `as unknown as X`.
   TypeScript will not catch a schema mismatch.
7. **`parent.kid` is not a column.** It's attached client-side in `useParent`. Strip it before
   any update — `ParentPage` does this with `kid: undefined`.
8. **Deliverer options are a cache entry, not a memoized call.** `delivererOptions` in
   `src/utils/delivererOptions.ts` is an `OptionSource`; `DelivererPage` invalidates
   `queryKeys.options('deliverer_options')` after a save, so a new deliverer shows up in the
   parent form immediately. If you add another way to create a deliverer, invalidate it too.
9. **Print output** relies on the `@media print` block in `index.html` plus the `<style>` tag
   `LabelPage` injects into `<head>` on mount. The label sheet is hard-coded to US Letter
   with 4"×2" labels, 10 per page.
10. **Popup blockers eat deliverer emails.** `generateEmails` calls `window.open('mailto:…')`
    once per deliverer in a loop; browsers typically allow only the first.

## 8. Working agreements for AI assistants

- Prefer extending `OasisForm` / `OasisTable` / `cellRenderers` over writing bespoke MUI.
- Any new Supabase query goes in `src/supabase.ts`, wrapped in a `useQuery` hook under
  `src/hooks/`. Writes are a `useMutation` in the page, with a success toast and an
  `invalidateQueries` for every key the write affects.
- Never reintroduce `alert()` or `confirm()`; use `useToast()` / `useConfirm()`.
- If you change the schema, update **all four**: `dataModel.sql`, `src/types.ts`, the view
  definitions that touch the column, and `scripts/generateTriggersAndPolicies.js`.
- Don't add a dependency without saying why in the PR — the tree is deliberately small.
- Never weaken the `is_deleted` filters, and never surface `hardDelete` in the UI.
- Treat anything in `docs/ISSUES.md` marked **Critical** as blocking for any release that
  touches auth or user management.
- Changing access control means changing `scripts/generateTriggersAndPolicies.js` **and**
  re-running its output against the database. Editing the script alone changes nothing.
