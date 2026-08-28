# Known Issues

Defects found in a review of the codebase on 2026-08-27, plus what has been fixed since.
Numbers are stable — other docs cite them, so a closed issue keeps its number in the
[ledger](#fixed) rather than being renumbered away.

Severity: **Critical** = exploitable or data-corrupting · **High** = wrong behavior users
will hit · **Medium** = correctness/robustness · **Low** = polish and hygiene.

All Critical and High *security* issues are closed and verified in production
([SECURITY-FIX-DEPLOY.md](SECURITY-FIX-DEPLOY.md)); the only follow-up there is rotating the
anon key (#6). Enhancements — as opposed to defects — live in [ROADMAP.md](ROADMAP.md).

---

## Open

### 49. High — No idle timeout on a session

Nothing in `src/` signs a user out after inactivity, and the Supabase session refreshes
itself indefinitely. This app holds names, addresses, phone numbers, country of origin, and
estimated income for refugee families, and it is used on phones and shared tablets, sometimes
in a car. An unattended unlocked device is a full disclosure of the roster.

**Fix:** an inactivity timer that calls `logOut()` — 15–30 minutes, reset on interaction,
with a warning before it fires so nobody loses a half-typed form. Cheap, and the kind of
control a partner agency or funder will eventually ask about.

### 35. High — Thin test coverage — *partly fixed*

> Fixed 2026-08-27/28: Vitest in CI over all of `src/utils/`; `jsdom` + RTL and 18 tests on
> `OasisForm`; a Playwright smoke test over sign-in → family → child → order → totals against
> a network-level Supabase mock. 66 unit tests plus 4 E2E specs.

**Still open:** the TanStack Query data layer and each page's loading/error branches have no
unit tests, and the E2E mock reimplements the SQL views in TypeScript, so nothing guards the
real view semantics — ROADMAP §6.4.

### 5. Medium — No password policy — *partly fixed*

> Fixed 2026-08-27: `OasisTextField` forwards `autoComplete`, and the sign-in and
> change-password forms pass `username` / `current-password` / `new-password`.

**Still open:** [ChangePasswordPage.tsx](../src/components/pages/ChangePasswordPage.tsx)
requires only a non-empty value matching the confirmation. Enforce a minimum length, and set
Supabase's password requirements in the dashboard.

### 17. Medium — Deliverer emails are blocked after the first one

[generateEmails.ts:30](../src/components/pages/FinishedOrderPage/generateEmails.ts#L30) opens
one `mailto:` per deliverer in a loop. Browsers allow one popup per user gesture, so most are
silently dropped — a monthly workflow that quietly loses most of its output. `mailto:` bodies
are also capped around 2000 characters by many clients, truncating long delivery lists.

**Fix:** a dialog with a per-deliverer "Open email" button and a copy-to-clipboard fallback.
Server-side sending is the real answer — ROADMAP §4.

### 31. Medium — Dark mode is forced

`* {color-scheme: dark}` in [index.html](../index.html) plus a hardcoded dark palette in
[theme.ts](../src/theme.ts). No light mode, no `prefers-color-scheme`. Bad for printing and
for outdoor phone use. See ROADMAP §10.

### 37. Medium — Database types are hand-written and will drift — *partly fixed*

> Fixed 2026-08-28: the types were not merely unchecked, they were switched off. supabase-js
> requires a `Relationships` field on each table and view; without it `Database` failed to
> satisfy `GenericSchema`, `Schema` resolved to `never`, and every typed call silently
> accepted anything. Adding `Relationships: []` restored checking and immediately caught five
> drifted columns. `createOrder` is genuinely typechecked as a result.

**Still open:** [types.ts](../src/types.ts) is still hand-maintained; `from()` in
[supabase.ts](../src/supabase.ts) still casts to `any` and its call sites still use
`as unknown as X`. Generate with `supabase gen types typescript` and drop the casts. Until
then a new table or view **must** carry `Relationships: []`, or all checking switches back
off without a single error.

### 51. Low — Nothing prevents two orders for the same month

`finishOrder` always mints a new `order_record`. The Save button is disabled while the
mutation is in flight, so a double-click is covered, but two staff working at once — or a
retry after a timeout that actually succeeded — produces a duplicate order, and the
warehouse totals get placed twice. Cheap guard: check for an existing order in the same month
before creating, and confirm.

### 46. Low — TypeScript 7 is not adoptable yet

> Fixed 2026-08-28 (the ESLint half): ESLint 10 was blocked only by `eslint-plugin-react`,
> which caps at `eslint@^9.7`. Replaced with `@eslint-react/eslint-plugin` v5.

**Still open, twice over.** `typescript-eslint` caps at `typescript@<6.1.0` with no v9, no
`next`, and no canary above 8.68 — TS 7 is the native compiler port, so this is real work for
them, and there is no serious alternative to swap in short of `oxlint` or `biome`. And the
codebase is not ready either: forced in with `--legacy-peer-deps` it typechecks with errors
(`@types/node` no longer picked up implicitly, `@testing-library/react` resolving with no
`screen` or `waitFor`). Recheck when `typescript-eslint` ships TS 7 support.

### 23. Low — Deprecated MUI API — *partly fixed*

> Fixed 2026-08-27: `OasisTextField` uses `slotProps={{inputLabel: {shrink: true}}}`.

**Still open:** the `@ts-expect-error` in [OasisTable.tsx](../src/components/OasisTable.tsx)
over `QuickFilterControl` prop typing. Still required as of `@mui/x-data-grid` 9.12.0.

### 6. Low — Anon key is in git history

Hardcoded in `src/supabase.ts` until commit `298466a`; still present at `081bcdb`. Anon keys
are public by design, so not a breach — rotating is cheap hygiene.

### 33. Low — Table toolbar lost its standard controls

The custom header in [OasisTable.tsx](../src/components/OasisTable.tsx) replaced the MUI
default toolbar, dropping columns, filter, density, and CSV export. CSV in particular is
something this kind of org asks for constantly.

### 47. Low — A view's `ORDER BY` is convention, not contract — *partly fixed*

> Fixed 2026-08-28: ordering lives in the database for every list — `ORDER BY` in the views,
> a `SortSpec[]` on `getAllRecords` for raw tables. Fixed `kid_view` sorting by birth date
> (scattering aged-out kids through the roster) and `deliverer_options` sorting `is_active`
> ASC (retired volunteers above active ones in the family form's dropdown).

**Still open:** SQL does not guarantee a view's `ORDER BY` survives a `SELECT` from it.
Postgres preserves it for the simple plans these queries produce, and at this size that is
fine. If a table grows to where the planner gets creative, or paging is added, move the
ordering to an explicit `.order()`.

### 34. Low — Hardcoded contact address in generated emails

`selia.buss@oasis4refugees.org` is baked into
[generateEmails.ts:24](../src/components/pages/FinishedOrderPage/generateEmails.ts#L24). Move
to config or an org-settings row so it survives staff turnover.

### 41. Low — `supabase/seed.sql` is empty

Zero bytes. Populate it from `scripts/generateFake.js` or delete it. `scripts/` also has no
README explaining when to run what.

### 42. Low — Missing indexes on foreign keys — *partly fixed*

> Fixed 2026-08-28 as a side effect of #14: the composite primary keys on `order_parent` and
> `order_kid` lead with `order_id`, so the order views' joins are indexed.

**Still open:** `kid.parent_id`, `parent.deliverer_id`, and `order_kid.kid_id` have no index.
Fine at current scale, but the views join across all of them — and `rostered_kid_view` (#48)
adds another join on `kid.parent_id`.

### 43. Low — No audit trail

`created_at` / `modified_at` exist; `created_by` / `modified_by` do not. For an app holding
refugee family PII with several shared-access users, knowing who changed what has real
operational and compliance value. See ROADMAP §5.

---

## Fixed

Fixed 2026-08-27 unless noted. The security work is deployed and verified in production —
see [SECURITY-FIX-DEPLOY.md](SECURITY-FIX-DEPLOY.md).

### Security

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Critical | The user-management edge function never authorized its caller, so anyone with the public anon key could call any `auth.admin` method — full application takeover | Verifies the bearer token with `auth.getUser(token)`, requires `app_metadata.access_level === 'admin'`, and dispatches through an explicit handler allow-list instead of `auth.admin[action]` |
| 2 | Critical | One blanket `FOR ALL … USING (true)` RLS policy per table gave every authenticated account full read/write on all PII, and public signup was enabled | Per-operation policies from `scripts/generateTriggersAndPolicies.js`: `SELECT` needs `app_can_read()`, writes need `app_can_write()`. `app_access_level()` reads the JWT claim and falls back to `auth.users`, so an account with no level gets nothing. Signup disabled and re-verified (HTTP 422) |
| 3 | High | New users were created with the hardcoded password `abcdefg` and were signable-into immediately | `inviteUserByEmail` creates the account with no password at all |
| 4 | Medium | Edge function sent `Access-Control-Allow-Origin: *` | Origin allow-list via the `ALLOWED_ORIGINS` env var |

`access_level` moved from `user_metadata` (self-writable) to `app_metadata` as part of #1 —
see the warning in [CLAUDE.md](../CLAUDE.md) §4.

### Correctness

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 7 | High | Realtime `UPDATE` patched soft-deleted rows in place, so a deleted family could still be snapshotted into a new order | `useTable` drops the row when `newRecord.is_deleted` is true |
| 8 | High | Dashboard counted inactive records under "Active" labels | `getTableCount` filters `is_active`, and its parameter narrowed to `TableWithActiveFlag` so it can't be called on the order tables |
| 9 | High | Every Supabase error called `alert()`, threw, and left the page on a spinner | `fail()` logs and throws; react-query retries twice then renders `<ErrorState>` with Retry |
| 48 | Medium | The dashboard's "Active Kids" count read the `kid` table on the kid's own flags alone, so children of a deactivated or deleted family stayed on the front page as active — while `kid_view` hid them from the Kids list and `finishOrder` skipped them in the order. #8, one join short *(2026-08-28)* | New `rostered_kid_view` (kid rows whose parent is live and active); `COUNT_SOURCE` in [supabase.ts](../src/supabase.ts) routes the kid count through it. Migration `20260828000004`; pinned by [e2e/dashboard.spec.ts](../e2e/dashboard.spec.ts) |
| 10 | High | `dataModel.sql` had a trailing comma before the closing `)` of `order_kid`, so the file wouldn't run *(2026-08-28)* | Comma removed |
| 11 | High | `dataModel.sql` created `parent` before the `deliverer` it references, and dropped `deliverer` after creating `parent`, cascading away the constraint on a re-run *(2026-08-28)* | `DROP TABLE`s grouped at the top in reverse dependency order; tables created in dependency order, `deliverer` first |
| 12 | Medium | `parent_order_view` evaluated `NOT ok.is_deleted` in `WHERE` on a `LEFT JOIN`ed table, collapsing it to an inner join — a family in an order with no surviving `order_kid` rows vanished from the historical record *(2026-08-28)* | Predicate moved into the `LEFT JOIN … ON` clause; migration `20260828000001` |
| 13 | Medium | Order creation was three separate inserts, so a failure in the second or third left a committed, half-populated order behind — and navigated the user into it as if complete *(2026-08-28)* | The whole snapshot moved into the `create_order` Postgres function, called via `supabase.rpc()`. `SECURITY INVOKER`, so RLS still gates it. Migration `20260828000003`; the E2E mock implements it too |
| 14 | Medium | `order_parent` and `order_kid` had no primary key, so a retried insert appended a second copy of every row and double-counted the diapers the org orders against *(2026-08-28)* | Composite primary keys `(order_id, parent_id)` and `(order_id, kid_id)`, after de-duplicating existing rows. Key columns are `NOT NULL` now too |
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
| 24 | High | No navigation — reaching Kids from Deliverers meant going home first | [OasisNav.tsx](../src/components/OasisNav.tsx): AppBar links at `md`+, hamburger `Drawer` below, active section carries `aria-current` |
| 25 | High | Saving gave no confirmation | Every mutation toasts on success and failure; delete buttons disable while in flight |
| 26 | High | Navigating away from a dirty form discarded the edits silently *(2026-08-28)* | `useUnsavedChangesPrompt` blocks in-app navigation via `useBlocker` plus a `beforeunload` handler. Mutations that navigate on success call `allowNextNavigation()` first |
| 27 | Medium | Native `alert()` and `confirm()` | `useToast()` and promise-based `useConfirm()`; neither native call appears in `src/` any more |
| 28 | Medium | Delete dialogs claimed a soft delete "cannot be undone" | Copy says an administrator can restore it. The user-delete dialog still says it, where it's true. Restore UI is ROADMAP §5 |
| 29 | Medium | `linkButton`, `anchor`, and `mapAnchor` rendered bare `<Link>` / `<a>`, so every table link came out browser-default blue turning visited-purple *(2026-08-28)* | All three use MUI `<Link>`, plus a `MuiLink` theme default: `underline: 'hover'` and a `focus-visible` ring |
| 30 | Medium | Not usable on a phone: the table header was clipped by the column headers, and fixed pixel widths made every table a sideways-scroll maze *(2026-08-28)* | The title/search/Add row moved out of the grid's fixed-height `toolbar` slot into [OasisTable](../src/components/OasisTable.tsx)'s own markup — driving the quick filter through `filterModel` — and below `sm` each table shows only its `mobileColumns`. Wide `<Table>`s scroll inside a `TableContainer`, the label sheet zooms to fit, and sign-in has a page of its own |
| 32 | Low | Toolbar title was an `onClick` on a `Typography` — not focusable, invisible to screen readers | Logo and title sit inside one `<Link to="/">` |
| 45 | Low | The Save button swapped its label for a bare `<CircularProgress>` while saving, leaving it with no accessible name *(2026-08-28)* | Label reads "Saving…" with the spinner as an `aria-hidden` `startIcon` |

### Infrastructure

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 36 | Medium | CI used `npm install` and outdated actions, and never ran ESLint | `npm ci` plus lint, typecheck, test, and `check:functions` on current actions |
| 38 | Medium | No migration system; `dataModel.sql` was applied by hand and contains `DROP TABLE … CASCADE` | Schema changes go through `supabase/migrations/` and `npx supabase db push` |
| 44 | Medium | `react-router` had open high-severity advisories *(2026-08-28)* | Bumped to 7.18.2, once #35's smoke test could catch a routing regression. `npm audit` is clean |
| 39 | Low | No `.env.example` — the template lived only in the README *(2026-08-28)* | `.env.example` committed; the README says `cp .env.example .env` |
| 40 | Low | No `format` script, no `engines` or `.nvmrc`, version stuck at `0.0.0` *(2026-08-28)* | `npm run format`, `engines: node >=22`, `.nvmrc`, version `1.0.0`. Prettier's options moved into `.prettierrc.json` so the CLI, the editor, and `npm run lint` cannot disagree |
