# Known Issues

Defects found in a review of the codebase on 2026-08-27, plus what has been fixed since.
Numbers are stable — other docs cite them, so a closed issue keeps its number in the
[ledger](#fixed) at the bottom rather than being renumbered away.

Severity: **Critical** = exploitable or data-corrupting · **High** = wrong behavior users
will hit · **Medium** = correctness/robustness · **Low** = polish and hygiene.

**All Critical and High security issues are closed and verified in production**
([SECURITY-FIX-DEPLOY.md](SECURITY-FIX-DEPLOY.md)). The only security follow-up is rotating
the anon key (#6). Enhancements — as opposed to defects — live in [ROADMAP.md](ROADMAP.md).

---

## Open

### 35. High — Thin test coverage — *partly fixed*

> **Fixed 2026-08-27:** Vitest in CI, and all of `src/utils/` covered — 46 tests over the
> diaper-quantity rules, order-snapshot consolidation, and the small helpers.
>
> **Fixed 2026-08-28:** `jsdom` + React Testing Library wired up, and
> [OasisForm.test.tsx](../src/components/OasisForm.test.tsx) adds 18 tests over field
> rendering, required-field validation, the dirty/submitting Save button, `OptionSource`
> cache sharing, and every branch of the unsaved-changes blocker (#26). 64 tests total.

> **Fixed 2026-08-28:** a Playwright smoke test ([e2e/smoke.spec.ts](../e2e/smoke.spec.ts))
> walks sign-in → add a family → add a child → create the order → verify the frozen totals,
> against a Supabase mock at the network boundary. It runs in CI with no Docker and no
> credentials. Verified by mutation: changing a diaper quantity and breaking a route each
> fail it.

**Still open:** the TanStack Query data layer and each page's loading/error branches have no
unit tests, and the E2E mock reimplements the SQL views in TypeScript, so nothing yet guards
the real view semantics — ROADMAP §6.4.

### 5. Medium — No password policy — *partly fixed*

> **Fixed 2026-08-27:** the `autoComplete` half. `OasisTextField` forwards `autoComplete`,
> and the sign-in and change-password forms pass `username` / `current-password` /
> `new-password`, so password managers behave.

**Still open:** [ChangePasswordPage.tsx](../src/components/pages/ChangePasswordPage.tsx)
requires only a non-empty value matching the confirmation. Enforce a minimum length and set
Supabase's password requirements in the dashboard.

### 13. Medium — Order creation is not transactional

[NewOrderPage.tsx:35-68](../src/components/pages/NewOrderPage/NewOrderPage.tsx#L35-L68)
inserts `order_record`, then `order_parent` and `order_kid` in a `Promise.all`. If either of
the latter fails, an orphaned or half-populated order is left behind and the user is
navigated to it anyway.

**Fix:** move the whole snapshot into a Postgres function and call it via `supabase.rpc()`.

### 14. Medium — `order_parent` and `order_kid` have no primary key

[dataModel.sql:75-87](../dataModel.sql#L75-L87). A retried insert produces duplicate rows and
double-counts diapers. Add composite primary keys `(order_id, parent_id)` and
`(order_id, kid_id)`.

### 17. Medium — Deliverer emails are blocked after the first one

[generateEmails.ts:30](../src/components/pages/FinishedOrderPage/generateEmails.ts#L30) opens
one `mailto:` per deliverer inside a loop. Browsers allow one popup per user gesture, so most
emails are silently dropped. `mailto:` bodies are also capped around 2000 characters by many
clients, truncating long delivery lists without warning.

**Fix:** render the list as a dialog with a per-deliverer "Open email" button and a
"Copy to clipboard" fallback — or send server-side (ROADMAP §4).

### 31. Medium — Dark mode is forced

`* {color-scheme: dark}` in [index.html](../index.html) and a hardcoded dark palette in
[src/theme.ts](../src/theme.ts). No light mode, no respect for `prefers-color-scheme`.
Dark-only is a real problem for printing and for outdoor phone use. See ROADMAP §10.

### 37. Medium — Database types are hand-written and will drift

[types.ts](../src/types.ts) is maintained by hand, `from()` in
[supabase.ts:52](../src/supabase.ts#L52) casts to `any`, and call sites use `as unknown as X`.
TypeScript cannot catch a schema mismatch anywhere in the app. Generate types with
`supabase gen types typescript` and drop the casts.

### 46. Low — TypeScript 7 is not adoptable yet

> **Fixed 2026-08-28 (the ESLint half):** ESLint 10 was blocked only by
> `eslint-plugin-react`, whose latest release still caps at `eslint@^9.7`. Replaced with
> [`@eslint-react/eslint-plugin`](https://eslint-react.xyz) v5, which declares `eslint: '*'`;
> every other plugin already supported 10.

**Still open:** TypeScript 7 is blocked twice over, and neither is a peer-range technicality.

1. `typescript-eslint` caps at `typescript@<6.1.0` and has published no v9, no `next` tag,
   and no canary above 8.68. TS 7 is the native compiler port, so this is a real piece of
   work for them, not a version-range bump. There is no alternative to swap in: it is the
   only serious TypeScript integration for ESLint. The nuclear option is dropping it for
   `oxlint` or `biome`, which is a much bigger change than this project needs.
2. **The codebase is not ready either.** Forcing TS 7 in with `--legacy-peer-deps`
   typechecks with errors: `@types/node` is no longer picked up implicitly (it wants an
   explicit `types` field), and `@testing-library/react` resolves with no exported `screen`
   or `waitFor`. So even with the linter solved there is a migration to do.

Recheck when `typescript-eslint` ships TS 7 support.

### 23. Low — Deprecated MUI API — *partly fixed*

> **Fixed 2026-08-27:** `OasisTextField` uses `slotProps={{inputLabel: {shrink: true}}}`
> instead of the deprecated `InputLabelProps`.

**Still open:** the `@ts-expect-error` in
[OasisTable.tsx](../src/components/OasisTable.tsx) papering over `QuickFilterControl` prop
typing. Still required as of `@mui/x-data-grid` 9.12.0.

### 6. Low — Anon key is in git history

The Supabase URL and anon key were hardcoded in `src/supabase.ts` until commit `298466a`;
they remain in the history at `081bcdb`. Anon keys are public by design so this is not itself
a breach, but rotating the key is cheap hygiene.

### 33. Low — Table toolbar lost its standard controls

The custom header in [OasisTable.tsx](../src/components/OasisTable.tsx) replaced the MUI
default toolbar, dropping the columns, filter, density, and CSV-export buttons. A
CSV export in particular is something this kind of org asks for constantly.

### 47. Low — A view's `ORDER BY` is convention, not contract — *partly fixed*

> **Fixed 2026-08-28:** ordering now lives in the database for every list: `ORDER BY` in the views, a `SortSpec[]`
> on `getAllRecords` for raw tables. `kid_view` sorted by birth date, which scattered kids
> who had aged out through the working roster, and `deliverer_options` sorted `is_active`
> ASC — false before true — so retired volunteers were listed above active ones in the
> family form's dropdown. Both fixed in
> [20260828000002](../supabase/migrations/20260828000002_sort_kid_view_and_deliverer_options.sql).

**Still open:** SQL does not guarantee that a view's `ORDER BY` survives a `SELECT` from
that view — Postgres preserves it for the simple plans these queries produce, but a
parallel or re-ordered plan would be within its rights. At this size it is fine. If a table
grows to where the planner gets creative, or if paging is ever added, move the ordering to
an explicit `.order()` on the query.

### 34. Low — Hardcoded contact address in generated emails

`selia.buss@oasis4refugees.org` is baked into
[generateEmails.ts:24](../src/components/pages/FinishedOrderPage/generateEmails.ts#L24). Move
to config or an org-settings row so it survives staff turnover.

### 41. Low — `supabase/seed.sql` is empty

Zero bytes. Either populate it from `scripts/generateFake.js` or delete it. The `scripts/`
directory generally has no README explaining when to run what.

### 42. Low — Missing indexes on foreign keys

`dataModel.sql` declares no indexes on `kid.parent_id`, `parent.deliverer_id`,
`order_parent.order_id`, `order_kid.order_id`, or `order_kid.kid_id`. Fine at current scale,
but the views join across all of them.

### 43. Low — No audit trail

`created_at` / `modified_at` exist but not `created_by` / `modified_by`. For an application
holding refugee family PII with several shared-access users, knowing who changed what has
real operational and compliance value. See ROADMAP §5.

---

## Fixed

Fixed 2026-08-27 unless noted. The security work is deployed and verified in production —
see [SECURITY-FIX-DEPLOY.md](SECURITY-FIX-DEPLOY.md).

### Security

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Critical | The user-management edge function never authorized its caller, so anyone with the public anon key could call any `auth.admin` method — full application takeover | Verifies the bearer token with `auth.getUser(token)`, requires `app_metadata.access_level === 'admin'`, and dispatches through an explicit handler allow-list instead of `auth.admin[action]` |
| 2 | Critical | One blanket `FOR ALL … USING (true)` RLS policy per table gave every authenticated account full read/write on all PII, and public signup turned out to be enabled | Per-operation policies from `scripts/generateTriggersAndPolicies.js`: `SELECT` needs `app_can_read()`, writes need `app_can_write()`. `app_access_level()` reads the JWT claim and falls back to `auth.users`, so an account with no assigned level gets nothing. Signup disabled and re-verified (HTTP 422) |
| 3 | High | New users were created with the hardcoded password `abcdefg` and were signable-into immediately | `inviteUserByEmail` creates the account with no password at all |
| 4 | Medium | Edge function sent `Access-Control-Allow-Origin: *` | Origin allow-list via the `ALLOWED_ORIGINS` env var |

`access_level` moved from `user_metadata` (self-writable) to `app_metadata` across the whole
app as part of #1 — see the warning in [CLAUDE.md](../CLAUDE.md) §4.

### Correctness

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 7 | High | Realtime `UPDATE` patched soft-deleted rows in place, so a deleted family could still be snapshotted into a new order | `useTable` drops the row when `newRecord.is_deleted` is true |
| 8 | High | Dashboard counted inactive records under "Active" labels | `getTableCount` filters `is_active`, and its parameter narrowed to `TableWithActiveFlag` so it can't be called on the order tables |
| 9 | High | Every Supabase error called `alert()`, threw, and left the page on a spinner | `fail()` logs and throws; react-query retries twice then renders `<ErrorState>` with Retry. See ROADMAP §2 |
| 10 | High | `dataModel.sql` had a trailing comma before the closing `)` of `order_kid`, so the file wouldn't run *(2026-08-28)* | Comma removed |
| 11 | High | `dataModel.sql` created `parent` before the `deliverer` it references, and dropped `deliverer` after creating `parent`, cascading away the constraint on a re-run *(2026-08-28)* | All `DROP TABLE` statements grouped at the top in reverse dependency order; tables created in dependency order, `deliverer` first |
| 12 | Medium | `parent_order_view` evaluated `NOT ok.is_deleted` in `WHERE` on a `LEFT JOIN`ed table, collapsing it to an inner join — a family in an order with no surviving `order_kid` rows vanished from the historical record entirely *(2026-08-28)* | Predicate moved into the `LEFT JOIN … ON` clause as `ok.is_deleted IS NOT TRUE`, so the outer join survives and `json_agg`'s `'[]'` fallback renders as intended. Migration `20260828000001_fix_parent_order_view_outer_join.sql`; `dataModel.sql` synced |
| 15 | Medium | Non-admins got an infinite spinner instead of "Access Denied" | Admin guard runs before the loading check, and the user list isn't requested at all for non-admins |
| 16 | Medium | `LabelPage` called `.sort()` on state in place | Sorts a copy |
| 18 | Medium | Null birth dates rendered as an empty cell in error red (`new Date(null)` is 1970) | Truthiness check before the date comparison |
| 19 | Low | No catch-all route — a mistyped hash rendered blank | `path: '*'` renders "Page not found"; also absorbs the post-invite fragment |
| 20 | Low | Sign-in form flashed on every load | `useSession` is one shared store with an explicit `loaded` flag; also removed four redundant `getSession()` round-trips |
| 21 | Low | `(undefined active parents, undefined kids)` during load | Subtitle renders only once `parents` is defined |
| 22 | Low | Empty `MenuItem` in every select | `<MenuItem value=""><em>None</em></MenuItem>`, omitted when the field is `required` |

### UX

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 24 | High | No navigation — reaching Kids from Deliverers meant going home first | [OasisNav.tsx](../src/components/OasisNav.tsx): AppBar links at `md`+, hamburger `Drawer` below, active section carries `aria-current`. Breadcrumbs still open — ROADMAP §1 |
| 25 | High | Saving gave no confirmation | Every mutation toasts on success and on failure; delete buttons disable while in flight |
| 26 | High | Navigating away from a dirty form discarded the edits silently *(2026-08-28)* | `useUnsavedChangesPrompt` in [OasisForm](../src/components/OasisForm.tsx) blocks in-app navigation via react-router's `useBlocker` and shows the `useConfirm()` dialog, plus a `beforeunload` handler for tab close and reload. Mutations that navigate on success call `allowNextNavigation()` first, so a save or delete doesn't also ask |
| 27 | Medium | Native `alert()` and `confirm()` | `useToast()` and promise-based `useConfirm()`; neither native call appears in `src/` any more |
| 28 | Medium | Delete dialogs claimed a soft delete "cannot be undone" | Copy says an administrator can restore it. The user-delete dialog still says it, where it's true. Restore UI is ROADMAP §5 |
| 32 | Low | Toolbar title was an `onClick` on a `Typography` — not focusable, invisible to screen readers | Logo and title sit inside one `<Link to="/">` |
| 29 | Medium | `linkButton`, `anchor`, and `mapAnchor` rendered bare `<Link>` / `<a>`, so every link in every table came out browser-default blue turning visited-purple *(2026-08-28)* | All three use MUI `<Link>` (the router one via `component={RouterLink}`), plus a `MuiLink` theme default: `underline: 'hover'` and a `focus-visible` ring |
| 45 | Low | The Save button swapped its label for a bare `<CircularProgress>` while saving, leaving it with no accessible name *(2026-08-28)* | Label reads "Saving…" with the spinner as an `aria-hidden` `startIcon`; the test that pinned the old behavior now asserts the accessible name |
| 30 | Medium | Not usable on a phone: the table header was clipped by the column headers, and fixed pixel column widths made every table a sideways-scroll maze *(2026-08-28)* | The title/search/Add row moved out of the grid's fixed-height `toolbar` slot into [OasisTable](../src/components/OasisTable.tsx)'s own markup — driving the quick filter through `filterModel` — and below `sm` each table shows only its `mobileColumns` (defaulting to the first two), flexed to the viewport with wrapping cells. The wide `<Table>`s on the finished-order page scroll inside a `TableContainer`, the label sheet zooms to fit, and the sign-in form has a page of its own. A stacked card list and a deliverer route view are still ROADMAP §3 |

### Infrastructure

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 36 | Medium | CI used `npm install` and outdated actions, and never ran ESLint | `npm ci` plus lint, typecheck, test, and `check:functions` steps on current actions |
| 38 | Medium | No migration system; `dataModel.sql` was applied by hand and contains `DROP TABLE … CASCADE` | Schema changes go through `supabase/migrations/` and `npx supabase db push` |
| 39 | Low | No `.env.example` — the template lived only in the README *(2026-08-28)* | `.env.example` committed; the README now says `cp .env.example .env` |
| 44 | Medium | `react-router` had open high-severity advisories *(2026-08-28)* | Bumped to 7.18.2, once #35's smoke test could catch a routing regression. `npm audit` is clean |
| 40 | Low | No `format` script, no `engines` or `.nvmrc`, version stuck at `0.0.0` *(2026-08-28)* | `npm run format`, `engines: node >=22`, `.nvmrc`, and version `1.0.0`. Prettier's options moved out of the ESLint rule into `.prettierrc.json` so the CLI, the editor, and `npm run lint` cannot disagree; `.prettierignore` keeps it off the hand-wrapped docs |
