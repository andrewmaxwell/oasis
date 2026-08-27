# Known Issues

Defects found in a review of the codebase on 2026-08-27. Ordered by severity. Each entry
names the file and line so it can be picked up directly.

> **Issues #1–#4, #15, #19, #20, #38 and part of #36 were fixed on 2026-08-27**, marked ✅
> below and kept for the record. The database migrations and the edge function are **deployed
> and verified in production**; see [SECURITY-FIX-DEPLOY.md](SECURITY-FIX-DEPLOY.md).
>
> **#24 and #32 (navigation) were also fixed on 2026-08-27** — see ROADMAP §1. **#7, #8,
> #16, #18, #21 and #22 were fixed on 2026-08-27** in a batch of small correctness fixes.
>
> **All Critical and High security issues are now closed and verified in production.** The
> only recommended follow-up is rotating the anon key (#6). See
> [SECURITY-FIX-DEPLOY.md](SECURITY-FIX-DEPLOY.md).

Legend: **Critical** = exploitable or data-corrupting · **High** = wrong behavior users will
hit · **Medium** = correctness/robustness · **Low** = polish and hygiene.

---

## Security

### ✅ FIXED — 1. Critical — The user-management edge function never authorizes its caller

> **Fixed.** [index.ts](../supabase/functions/user-management/index.ts) now verifies the
> bearer token with `auth.getUser(token)`, requires
> `app_metadata.access_level === 'admin'`, and dispatches through an explicit handler
> allow-list instead of `auth.admin[action]`. `access_level` was moved from `user_metadata`
> to `app_metadata` across the app so it can no longer be self-granted.

[supabase/functions/user-management/index.ts:22-42](../supabase/functions/user-management/index.ts#L22-L42)

The function creates a **service-role** Supabase client and then does:

```js
const {action, args = []} = await req.json();
const {data, error} = await supabase.auth.admin[action](...args);
```

The `Authorization` header is forwarded by the client but is **never read, verified, or
checked for `access_level === 'admin'`**. Supabase's default `verify_jwt` only proves the
bearer token was signed by this project — and the anon key, which ships in the public
JavaScript bundle, satisfies exactly that.

Consequence: anyone who opens DevTools on the deployed site can call any method on
`auth.admin`, including:
- `listUsers` — dump every account and its metadata
- `updateUserById` — set their own `user_metadata.access_level` to `admin`, or change any
  other user's password or email
- `createUser` / `deleteUser` — create or destroy accounts

This is full application takeover. The `useIsAdmin()` guards in
[UserTablePage.tsx:46](../src/components/pages/UserTablePage.tsx#L46) and
[UserPage.tsx:38](../src/components/pages/UserPage.tsx#L38) are cosmetic.

**Fix:**
1. Extract the bearer token, call `supabase.auth.getUser(token)`, and reject if it fails.
2. Reject unless that user's `user_metadata.access_level === 'admin'`.
3. Replace `auth.admin[action]` with an explicit allow-list —
   `{listUsers, getUserById, createUser, updateUserById, deleteUser, inviteUserByEmail}` —
   so an attacker can't reach unintended methods via arbitrary property lookup.
4. Validate `args` shape per action instead of spreading raw JSON.
5. Move `access_level` out of `user_metadata` (which users can edit themselves) into
   `app_metadata` or a dedicated `app_user` table, and have RLS read from there.

### ✅ FIXED — 2. Critical — RLS gives every authenticated user full access to all PII

> **Fixed and deployed**, except the dashboard toggle. `scripts/generateTriggersAndPolicies.js`
> emits per-operation policies: `SELECT` requires `public.app_can_read()`,
> `INSERT`/`UPDATE`/`DELETE` require `public.app_can_write()`. `public.app_access_level()`
> reads the JWT's `app_metadata` claim and falls back to `auth.users`, so an account with **no
> assigned level — i.e. anyone who self-registers — resolves to NULL and can neither read nor
> write.** Verified in production against live data.
>
> Public signup was found to be **enabled** on 2026-08-27 (a signup with the public anon key
> succeeded) and has since been turned off and re-verified (`signup_disabled`, HTTP 422).
> Note `config.toml` governs local dev only, and `supabase config push` is unsafe here — it
> would repoint `site_url` at localhost.

`scripts/generateTriggersAndPolicies.js:25-37` emits, for every table:

```sql
CREATE POLICY access_for_logged_in_users ON <table>
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

Combined with `enable_signup = true` in [supabase/config.toml:83](../supabase/config.toml#L83),
if public signup is also enabled on the **hosted** project then anyone who registers an
account can read and modify every refugee family's name, address, phone number, country of
origin, and estimated income.

**Fix:** confirm signup is disabled in the hosted Supabase dashboard (config.toml only
governs local dev). Then replace the blanket policy with per-operation policies keyed on the
server-side access level — `readOnly` gets `SELECT` only, `readWrite` gets write on the
domain tables, `admin` on everything.

### ✅ FIXED — 3. High — New users are created with the hardcoded password `abcdefg`

> **Fixed.** The `createUser`-with-password call is gone. The new `inviteUser` action
> creates the account via `inviteUserByEmail` with **no password at all**, so it cannot be
> signed into until the invitee sets one through the emailed link.

[src/components/pages/UserPage.tsx:65](../src/components/pages/UserPage.tsx#L65)

`createUser` is called with `password: 'abcdefg'` and an invite email is sent afterward. The
account exists and is signable-into with that known password from the moment it's created —
anyone who can guess a colleague's email address can sign in as them.

**Fix:** use `inviteUserByEmail` alone (it creates the user), or generate a
cryptographically random password server-side and never return it.

### ✅ FIXED — 4. Medium — Edge function allows any origin

> **Fixed.** Origins are checked against an allow-list, configurable via the
> `ALLOWED_ORIGINS` env var and defaulting to the GitHub Pages origin plus localhost.

[supabase/functions/user-management/index.ts:11](../supabase/functions/user-management/index.ts#L11)

`'Access-Control-Allow-Origin': '*'`. Restrict to the GitHub Pages origin and localhost.

### 5. Medium — No password policy

[ChangePasswordPage.tsx:36](../src/components/pages/ChangePasswordPage.tsx#L36) requires only
a non-empty value matching the confirmation. Enforce a minimum length and set Supabase's
password requirements in the dashboard. Also add `autoComplete="new-password"` /
`autoComplete="current-password"` so password managers behave.

### 6. Low — Anon key is in git history

The Supabase URL and anon key were hardcoded in `src/supabase.ts` until commit `298466a`;
they remain in the history at `081bcdb`. Anon keys are public by design so this is not
itself a breach, but rotating the key is cheap hygiene — and it matters more than usual here
because of issue #1, where the anon key is effectively an admin credential.

---

## Correctness

### ✅ FIXED — 7. High — Realtime updates don't handle soft deletes

> **Fixed.** The `UPDATE` branch in [useTable.ts](../src/hooks/useTable.ts) now drops the
> row when `newRecord.is_deleted` is true instead of patching it in place, so a family
> soft-deleted in another tab leaves the new-order list immediately.

[src/hooks/useTable.ts:18-22](../src/hooks/useTable.ts#L18-L22)

A soft delete is an `UPDATE` setting `is_deleted = true`. The `UPDATE` branch replaces the
row in place, so deleted records stay in the in-memory list. Since `useTable` feeds
`useParentsWithAtLeastOneKid` → `NewOrderPage`, a family deleted in another tab can still be
snapshotted into a new order.

**Fix:** in the `UPDATE` branch, drop the row when `newRecord.is_deleted` is true.

### ✅ FIXED — 8. High — Dashboard counts say "Active" but count inactive records too

> **Fixed.** `getTableCount` now filters `is_active = true` as well as `is_deleted = false`.
> Its parameter was narrowed from `TableWithSoftDelete` to the new `TableWithActiveFlag`
> (`parent` | `kid` | `deliverer`), so it can't be called against the order tables, which
> have no `is_active` column. **The dashboard numbers will drop** — they were previously
> inflated by inactive records.

[src/supabase.ts:76-82](../src/supabase.ts#L76-L82) filters only on `is_deleted`, but
[LandingPage.tsx:144,152,160](../src/components/pages/LandingPage.tsx#L142-L164) labels the
results "Active Families", "Active Kids", "Active Deliverers". The headline numbers on the
first screen users see are wrong.

**Fix:** add `.eq('is_active', true)` to `getTableCount`, or relabel to "Families" / "Kids" /
"Deliverers".

### 9. High — All Supabase errors alert, throw, and hang the page

[src/supabase.ts:54-58](../src/supabase.ts#L54-L58)

```js
const log = (error) => { console.error(error); alert(error.message); throw error; };
```

Because it throws, the `return data` after each `if (error) log(error)` is unreachable, and
no caller attaches `.catch`. Every failed query is an unhandled promise rejection that
leaves the page stuck on a spinner behind a native alert box. A dropped connection is
indistinguishable from a permanent hang.

**Fix:** return a result rather than throwing; surface failures through an MUI Snackbar and
render an inline error state with a retry action. See ROADMAP §2.

### 10. High — `dataModel.sql` has a syntax error and won't run

[dataModel.sql:83-84](../dataModel.sql#L83-L84) — trailing comma after
`is_deleted BOOLEAN NOT NULL DEFAULT false,` before the closing `)` of `order_kid`.

### 11. High — `dataModel.sql` statement order is wrong

- Line 22: `parent.deliverer_id` references `deliverer(id)`, but `deliverer` isn't created
  until line 47.
- Line 46: `DROP TABLE IF EXISTS deliverer CASCADE` runs *after* `parent` is created, so on a
  re-run it cascade-drops the constraint that line 22 just added.

**Fix:** create `deliverer` first, and group all `DROP` statements at the top in reverse
dependency order.

### 12. Medium — `parent_order_view` silently hides orders with no kid rows

[dataModel.sql:216](../dataModel.sql#L216) — `WHERE NOT ok.is_deleted` on a `LEFT JOIN`ed
table turns the outer join into an inner join, dropping any row where `ok` is NULL. The
`COALESCE(json_agg(ok) FILTER (WHERE ok IS NOT NULL), '[]')` on line 210 shows the intent
was to keep those rows.

**Fix:** move the predicate into the `LEFT JOIN … ON` clause, or write
`(ok.is_deleted IS NOT TRUE)`.

### 13. Medium — Order creation is not transactional

[NewOrderPage.tsx:35-68](../src/components/pages/NewOrderPage/NewOrderPage.tsx#L35-L68)
inserts `order_record`, then `order_parent` and `order_kid` in a `Promise.all`. If either of
the latter fails, an orphaned or half-populated order is left behind and the user is
navigated to it anyway.

**Fix:** move the whole snapshot into a Postgres function and call it via `supabase.rpc()`.

### 14. Medium — `order_parent` and `order_kid` have no primary key

[dataModel.sql:70-84](../dataModel.sql#L70-L84). A retried insert produces duplicate rows and
double-counts diapers. Add composite primary keys `(order_id, parent_id)` and
`(order_id, kid_id)`.

### ✅ FIXED — 15. Medium — Non-admins see an infinite spinner instead of "Access Denied"

> **Fixed.** The `isAdmin` guard now runs before the loading spinner in both `UserPage`
> and `UserTablePage`, and `UserTablePage` no longer requests the user list at all unless
> the caller is an admin.

The `!user` spinner returned before the `!isAdmin` check, and `useUser` never resolves for a non-admin.
Swap the two checks. Same ordering concern in
[UserTablePage.tsx](../src/components/pages/UserTablePage.tsx#L42-L46), where the user list is
fetched before the admin check runs.

### ✅ FIXED — 16. Medium — `LabelPage` mutates React state in place

> **Fixed.** [LabelPage.tsx](../src/components/pages/LabelPage.tsx) sorts a copy —
> `[...orderParents].sort(…)`.

[LabelPage.tsx:62](../src/components/pages/LabelPage.tsx#L62) calls `.sort()` directly on the
`orderParents` array from state. Copy first: `[...orderParents].sort(…)`, as
[useOrderRecordWithParents.ts:20](../src/hooks/useOrderRecordWithParents.ts#L20) correctly does.

### 17. Medium — Deliverer emails are blocked after the first one

[generateEmails.ts:30](../src/components/pages/FinishedOrderPage/generateEmails.ts#L30) opens
one `mailto:` per deliverer inside a loop. Browsers allow one popup per user gesture, so
most emails are silently dropped. `mailto:` bodies are also capped around 2000 characters by
many clients, truncating long delivery lists without warning.

**Fix:** render the list as a dialog with a per-deliverer "Open email" button and a
"Copy to clipboard" fallback — or send server-side (ROADMAP §4).

### ✅ FIXED — 18. Medium — Missing birth dates render as an empty red cell

> **Fixed.** `birthDate` in [cellRenderers.tsx](../src/components/cellRenderers.tsx) tests
> the value for truthiness before the date comparison.

[cellRenderers.tsx:47-60](../src/components/cellRenderers.tsx#L47-L60) —
`new Date(null)` is the 1970 epoch, so a null birth date always tests as "more than three
years ago" and renders empty text in error red. Guard for a falsy value first.

### ✅ FIXED — 19. Low — No catch-all route

> **Fixed.** [App.tsx](../src/App.tsx) has a `path: '*'` route rendering a "Page not found"
> screen with a link home. It also absorbs the moment after an invite redirect when the
> fragment still holds Supabase's auth params and matches no route.

[App.tsx:28-53](../src/App.tsx#L28-L53) defines no `path: '*'`. A mistyped hash renders a
blank page. Add a 404 route with a link home.

### ✅ FIXED — 20. Low — Sign-in form flashes on every load

> **Fixed.** `useSession` is now a single shared store (`useSyncExternalStore`) exposing an
> explicit `loaded` flag, so "logged out" and "not yet known" are distinguishable. This also
> removed four redundant `getSession()` round-trips and the matching flash in `useCanWrite()`,
> which previously reported `false` on every mount.

`useSession` initialized to `null`, which `App` read as "logged out".

### ✅ FIXED — 21. Low — `undefined` shown in the parents table subtitle

> **Fixed.** [ParentTablePage.tsx](../src/components/pages/ParentTablePage.tsx) renders an
> empty subtitle until `parents` has loaded.

[ParentTablePage.tsx:77](../src/components/pages/ParentTablePage.tsx#L77) renders
`(undefined active parents, undefined kids)` during load. Render the subtitle only once
`parents` is defined.

### ✅ FIXED — 22. Low — Empty `MenuItem` in every select

> **Fixed.** [OasisSelect.tsx](../src/components/OasisSelect.tsx) renders
> `<MenuItem value=""><em>None</em></MenuItem>`, and omits it entirely when the field is
> `required`.

[OasisSelect.tsx:56](../src/components/OasisSelect.tsx#L56) renders `<MenuItem></MenuItem>`
with no `value`, producing a zero-height blank row and an out-of-range value warning from
MUI. Use `<MenuItem value=""><em>None</em></MenuItem>`, and omit it entirely when the field
is `required`.

### 23. Low — Deprecated MUI API

[OasisTextField.tsx:27](../src/components/OasisTextField.tsx#L27) uses `InputLabelProps`,
deprecated in MUI v7 in favor of `slotProps={{inputLabel: {…}}}`. There's also a
`@ts-expect-error` in [OasisTable.tsx:60](../src/components/OasisTable.tsx#L60) papering over
`QuickFilterControl` prop typing.

---

## UX

### ✅ FIXED — 24. High — There is no navigation

> **Fixed.** [OasisNav.tsx](../src/components/OasisNav.tsx) adds a persistent nav —
> Dashboard · Families · Kids · Deliverers · Orders, plus Users for admins — rendered as
> inline AppBar links at `md` and up and as a hamburger `Drawer` below it. The active
> section is highlighted and carries `aria-current="page"`; detail routes count as their
> section (`/parent/:id` highlights Families). Breadcrumbs, the other half of ROADMAP §1,
> are still outstanding.

[OasisToolbar.tsx](../src/components/OasisToolbar.tsx) contains only a logo, a title, and the
account menu. Reaching Kids from Deliverers means going home first, every time. This is the
single biggest usability gap in the app. See ROADMAP §1.

### 25. High — Saving gives no confirmation

`OasisForm` disables the button while submitting, then re-enables it. On
[ParentPage](../src/components/pages/ParentPage.tsx#L100-L122) the user stays on the page with
no toast, no checkmark, nothing — so they press Save again. Add a success Snackbar.

### 26. High — Unsaved changes are lost silently

Navigating away from a dirty `OasisForm` discards edits with no prompt. `react-hook-form`
already exposes `formState.isDirty`; wire it to a router blocker and a confirmation dialog.

### 27. Medium — Native `alert()` and `confirm()` dialogs

Used in [supabase.ts:56](../src/supabase.ts#L56), `ParentPage`, `KidPage`, `DelivererPage`,
`UserPage`, and `FinishedOrderPage`. They're unstyled, unbranded, block the main thread, and
on mobile look like a browser malfunction. Replace with MUI `Dialog` and `Snackbar`.

### 28. Medium — Delete dialogs lie

Every confirm says "This cannot be undone," but `softDelete` only flips a flag. Either say
"You can ask an administrator to restore this" or build the restore UI (ROADMAP §5).

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

`* {color-scheme: dark}` in [index.html](../index.html) and a hardcoded
`createTheme({palette: {mode: 'dark'}})` in [main.tsx:6](../src/main.tsx#L6). No light mode,
no respect for `prefers-color-scheme`. Dark-only is a real problem for printing and for
outdoor phone use.

### ✅ FIXED — 32. Low — Toolbar title is a click target but not a button

> **Fixed.** The logo and title now sit inside one `<Link to="/">`, so the whole thing is a
> single keyboard-focusable, screen-reader-visible link. The `onClick`/`useNavigate` pair is
> gone, and the logo's `alt` is now "Oasis logo" rather than "logo".

[OasisToolbar.tsx:32](../src/components/OasisToolbar.tsx#L32) puts `onClick` on a
`Typography` — not keyboard focusable, no role, invisible to screen readers. Wrap in the
same `<Link>` the logo uses.

### 33. Low — Table toolbar lost its standard controls

The custom toolbar in [OasisTable.tsx:29-90](../src/components/OasisTable.tsx#L29-L90)
replaced the MUI default, dropping the columns, filter, density, and CSV-export buttons. A
CSV export in particular is something this kind of org asks for constantly.

### 34. Low — Hardcoded contact address in generated emails

`selia.buss@oasis4refugees.org` is baked into
[generateEmails.ts:24](../src/components/pages/FinishedOrderPage/generateEmails.ts#L24). Move
to config or an org-settings row so it survives staff turnover.

---

## Infrastructure & maintainability

### 35. High — No tests at all

No test runner, no test files. `src/utils/` is pure and trivially testable — `calcDiaperSizes`,
`consolidateOrderKids`, `getDifference`, `splitEvery`, `groupBy` — and encodes the domain
rules that matter most. See ROADMAP §6.

### ✅ FIXED — 36. Medium — CI uses `npm install` and outdated actions

> **Mostly fixed.** CI now runs `npm ci`, lint, `typecheck`, and `check:functions`, and the
> actions are current. Still outstanding: no test step, because there are no tests (#35).

[.github/workflows/main.yml](../.github/workflows/main.yml): `npm install` ignores the
lockfile — use `npm ci`. `actions/setup-node@v3` and `actions/configure-pages@v3` are behind.
There is no lint step; `npm run build` does run `tsc`, but ESLint never runs in CI.

### 37. Medium — Database types are hand-written and will drift

[types.ts](../src/types.ts) is maintained by hand, `from()` in
[supabase.ts:52](../src/supabase.ts#L52) casts to `any`, and call sites use `as unknown as X`.
TypeScript cannot catch a schema mismatch anywhere in the app. Generate types with
`supabase gen types typescript` and drop the casts.

### 38. Medium — No migration system

`dataModel.sql` is applied by hand and contains `DROP TABLE … CASCADE`, so running it against
production destroys data. Triggers, policies, and grants live separately in a script whose
output must be pasted in. Adopt `supabase/migrations/`.

### 44. Medium — `react-router` has open high-severity advisories

`react-router` / `react-router-dom` are pinned at 7.13.0; the advisories cover `6.0.0 –
7.18.1` and are fixed in **7.18.2**.

Practical exposure here is essentially nil — every advisory targets a server-side vector
(turbo-stream deserialization, prerendered redirect HTML, the `__manifest` endpoint,
single-fetch reflected input), and this app is a client-only SPA on GitHub Pages using
`createHashRouter` with no loaders, actions, SSR, or RSC. `npm audit` will keep flagging it
regardless.

Deliberately **not** bundled with the 2026-08-27 security work: it is a five-minor-version
bump to the routing layer, and there is no browser test in this repo to verify routing still
works afterwards (#35). Do it as its own change, and click through the app before merging:
sign in, each table page, a detail page, label printing, and the invite redirect.

```bash
npm i react-router-dom@^7.18.2 && npm run lint && npm run typecheck && npm run build
```

Everything else `npm audit` reports (babel, eslint, vite, rollup, esbuild, postcss, ws) is
build-chain only and not shipped to users.

### 39. Low — No `.env.example`

The template exists only in the README. Commit `.env.example` so `cp .env.example .env` works.

### 40. Low — Missing developer scripts and version pinning

No `typecheck`, `format`, or `test` script. No `engines` field or `.nvmrc`; the README says
Node 20+ while CI uses 22. `package.json` version is still `0.0.0`.

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
real operational and compliance value.
