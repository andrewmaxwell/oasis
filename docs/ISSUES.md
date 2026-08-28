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
> [OasisForm.test.tsx](../src/components/OasisForm.test.tsx) adds 17 tests over field
> rendering, required-field validation, the dirty/submitting Save button, `OptionSource`
> cache sharing, and every branch of the unsaved-changes blocker (#26). 63 tests total.

**Still open:** the TanStack Query data layer and every page's loading/error/save path. See
ROADMAP §6.3–§6.4 — a Playwright smoke test of the core flow, then view-level SQL assertions.

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

### 29. Medium — Links in tables are unstyled browser defaults

`linkButton`, `anchor`, and `mapAnchor` in
[cellRenderers.tsx](../src/components/cellRenderers.tsx) render bare `<Link>` / `<a>`, which
on the dark theme come out as default blue turning visited-purple — poor contrast and
inconsistent with every MUI control around them. Wrap in MUI `<Link>` with theme colors.

### 30. Medium — Not usable on a phone

`DataGrid` columns use fixed pixel widths up to 400 px with no responsive behavior, so on a
phone the tables are a horizontal-scroll maze. Deliverers checking an address mid-route are
exactly the mobile case. See ROADMAP §3.

### 31. Medium — Dark mode is forced

`* {color-scheme: dark}` in [index.html](../index.html) and a hardcoded dark palette in
[src/theme.ts](../src/theme.ts). No light mode, no respect for `prefers-color-scheme`.
Dark-only is a real problem for printing and for outdoor phone use. See ROADMAP §10.

### 37. Medium — Database types are hand-written and will drift

[types.ts](../src/types.ts) is maintained by hand, `from()` in
[supabase.ts:52](../src/supabase.ts#L52) casts to `any`, and call sites use `as unknown as X`.
TypeScript cannot catch a schema mismatch anywhere in the app. Generate types with
`supabase gen types typescript` and drop the casts.

### 44. Medium — `react-router` has open high-severity advisories

Pinned at 7.13.0; the advisories cover `6.0.0 – 7.18.1` and are fixed in **7.18.2**.

Practical exposure here is essentially nil — every advisory targets a server-side vector
(turbo-stream deserialization, prerendered redirect HTML, the `__manifest` endpoint,
single-fetch reflected input), and this app is a client-only SPA on GitHub Pages using
`createHashRouter` with no loaders, actions, SSR, or RSC. `npm audit` will keep flagging it
regardless. Everything else `npm audit` reports (babel, eslint, vite, rollup, esbuild,
postcss, ws) is build-chain only and not shipped to users.

Do it as its own change, and click through the app before merging — sign in, each table page,
a detail page, label printing, the invite redirect — because there is still no browser test
to catch a routing regression (#35).

```bash
npm i react-router-dom@^7.18.2 && npm run lint && npm run typecheck && npm test && npm run build
```

### 45. Low — The Save button has no accessible name while saving

[OasisForm.tsx](../src/components/OasisForm.tsx) swaps the "Save" label for a bare
`<CircularProgress>` while `submitting`, so for the length of the save the button's
accessible name is empty — a screen reader announces just "button", with no hint that
anything is in progress. Found by the new `OasisForm` tests, which assert the current
behavior so a fix makes them fail loudly.

**Fix:** keep the text beside the spinner, or add an `aria-label` and `aria-hidden` the
spinner. Fits the accessibility pass in ROADMAP §10.

### 23. Low — Deprecated MUI API — *partly fixed*

> **Fixed 2026-08-27:** `OasisTextField` uses `slotProps={{inputLabel: {shrink: true}}}`
> instead of the deprecated `InputLabelProps`.

**Still open:** the `@ts-expect-error` in
[OasisTable.tsx](../src/components/OasisTable.tsx) papering over `QuickFilterControl` prop
typing.

### 6. Low — Anon key is in git history

The Supabase URL and anon key were hardcoded in `src/supabase.ts` until commit `298466a`;
they remain in the history at `081bcdb`. Anon keys are public by design so this is not itself
a breach, but rotating the key is cheap hygiene.

### 33. Low — Table toolbar lost its standard controls

The custom toolbar in [OasisTable.tsx:29-90](../src/components/OasisTable.tsx#L29-L90)
replaced the MUI default, dropping the columns, filter, density, and CSV-export buttons. A
CSV export in particular is something this kind of org asks for constantly.

### 34. Low — Hardcoded contact address in generated emails

`selia.buss@oasis4refugees.org` is baked into
[generateEmails.ts:24](../src/components/pages/FinishedOrderPage/generateEmails.ts#L24). Move
to config or an org-settings row so it survives staff turnover.

### 39. Low — No `.env.example`

The template exists only in the README. Commit `.env.example` so `cp .env.example .env` works.

### 40. Low — Missing developer scripts and version pinning — *partly fixed*

> **Fixed 2026-08-27:** `typecheck`, `check:functions`, `test`, and `test:watch` scripts now
> exist and all but `test:watch` run in CI.

**Still open:** no `format` script, no `engines` field or `.nvmrc` (the README says Node 20+
while CI uses 22), and `package.json` version is still `0.0.0`.

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

### Infrastructure

| # | Sev | Issue | Fix |
| --- | --- | --- | --- |
| 36 | Medium | CI used `npm install` and outdated actions, and never ran ESLint | `npm ci` plus lint, typecheck, test, and `check:functions` steps on current actions |
| 38 | Medium | No migration system; `dataModel.sql` was applied by hand and contains `DROP TABLE … CASCADE` | Schema changes go through `supabase/migrations/` and `npx supabase db push` |
