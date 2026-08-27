# Roadmap — Enhancements

Ideas for bringing Oasis in line with modern best practices and giving volunteers a
genuinely good experience. Defects are tracked separately in [ISSUES.md](ISSUES.md); this
document is about what to *build*.

Each item notes rough effort (S/M/L) and why it's worth doing for **this** app — a
small-team, mobile-heavy, PII-holding non-profit tool.

---

## Priority order, if you only do a few things

1. ~~**Fix ISSUES.md #1–#3** (auth).~~ Done and verified in production.
2. ~~**§1 Navigation.**~~ Done, except breadcrumbs.
3. ~~**§2 Error and feedback layer.**~~ Done, along with the §11 data-layer work it rested on.
4. **§6 Tests on `src/utils/`.** Locks down the diaper-quantity math before refactoring —
   and now also the toast/mutation wiring, which has no coverage at all.
5. **§3 Mobile.** The delivery-day use case is currently unsupported.

---

## 1. Real navigation — S — ✅ mostly done

**Done (2026-08-27):** [`OasisNav.tsx`](../src/components/OasisNav.tsx) renders Dashboard · Families · Kids · Deliverers ·
Orders, plus Users for admins — AppBar buttons at `md` and up, hamburger `Drawer` below.
Active section highlighted with `aria-current`. Closes ISSUES #24 and #32.

**Still open:** breadcrumbs — `Families › Amara Okafor › Chidi` — replacing the ad-hoc "Back
to Parent" buttons on each page, which currently guess wrong when you arrived from the Kids
table rather than from a parent.

## 2. An error, loading, and feedback layer — M — ✅ done (2026-08-27)

Three related gaps: errors alert-and-hang (ISSUES #9), saves give no confirmation
(ISSUES #25), and loading is a bare centered spinner. All three are closed, built on top of
the TanStack Query migration in §11.

**Done:**
- **`<Snackbar>` provider** — [`ToastProvider.tsx`](../src/components/ToastProvider.tsx) with
  `useToast()` in [`hooks/useToast.ts`](../src/hooks/useToast.ts). Successes auto-hide after
  4 s; errors stay until dismissed. Queued, so two results can't overwrite each other.
  Supports a single inline action, which is the hook for an undo affordance (§5).
- **React error boundary** — [`ErrorBoundary.tsx`](../src/components/ErrorBoundary.tsx)
  around the router: "Something went wrong / Reload" instead of a white page.
- **Skeleton loaders** — `FormSkeleton`, `BlockSkeleton`, and `EmptyState` in
  [`PageStates.tsx`](../src/components/PageStates.tsx). Every form page, the order page, and
  the option selects render a field-shaped placeholder rather than a centered spinner.
- **Empty states.** `OasisTable` takes an `emptyMessage` and renders it as the grid's
  no-rows overlay — "No families yet — add your first one."
- **Inline error + retry.** `ErrorState` replaces the endless spinner on every page: a
  failed load says what happened and offers Retry, on top of react-query's two automatic
  retries. Closes ISSUES #9.
- **Native dialogs are gone.** [`ConfirmProvider.tsx`](../src/components/ConfirmProvider.tsx)
  provides a promise-based `useConfirm()`; `alert()` and `confirm()` no longer appear
  anywhere in `src/`. Closes ISSUES #27, and the delete copy no longer claims a soft delete
  "cannot be undone" (ISSUES #28).
- **Save confirmation.** Every mutation toasts on success and on failure, so nobody presses
  Save twice wondering. Closes ISSUES #25.

**Still open:**
- **Optimistic updates** on toggles like `is_active`, with rollback on failure. The
  `onMutate`/`onError` rollback pattern is available now but not used anywhere.

## 3. Mobile and offline — M/L

Deliverers use this in a car. Today it's a desktop app rendered small (ISSUES #30).

- **Responsive tables.** Below the `md` breakpoint, swap `DataGrid` for a stacked card list:
  name, address (tap to open Maps), phone (tap to call), diaper summary. `cellRenderers`
  already has `mapAnchor` and `tel:` anchors — surface them as proper touch targets.
- **PWA.** `vite-plugin-pwa` gives an installable app with an icon on the home screen. Cache
  the app shell and the current order's delivery list so a route sheet survives losing
  signal.
- **A deliverer-focused view.** Rather than making the admin UI work on a phone, add a
  `/deliverer/:id/order/:orderId` route: just my families, in delivery order, with tap-to-map,
  tap-to-call, and a "delivered" checkbox. This is arguably the highest-value new feature in
  the whole list.

## 4. Server-side email instead of `mailto:` — M

`generateEmails` is popup-blocked and length-limited (ISSUES #17). Move sending into a
Supabase edge function using Resend or SendGrid:

- Proper HTML email with a formatted delivery table.
- One click sends to every deliverer; a record of what was sent and when.
- A preview-before-send dialog.
- Optional: attach the label PDF (§7).

## 5. Restore, audit, and data safety — M

- **Restore UI.** Soft-deleted records are recoverable in the database but invisible in the
  app. Add an admin "Recently deleted" view with a Restore button, and change the delete
  copy accordingly (ISSUES #28).
- **Undo toast.** "Family deleted · UNDO" for 10 seconds covers the common misclick without
  needing the admin screen.
- **Audit log.** `created_by` / `modified_by` columns plus a `change_log` table, populated by
  trigger. Given the PII involved (ISSUES #43), this is closer to a requirement than a nice-to-have.
- **Field-level permissions.** `rough_family_income` and `country_of_origin` are the most
  sensitive columns; consider restricting them to `admin` once RLS is properly per-role.

## 6. Testing — M

Nothing is tested today (ISSUES #35). Highest value per hour, in order:

1. **Vitest on `src/utils/`.** `calcDiaperSizes` and `consolidateOrderKids` encode the
   business rules ("size 3 means 50 diapers") that a wrong answer costs the org real money.
   `getDifference`, `splitEvery`, `groupBy` are three-line tests each.
2. **React Testing Library on `OasisForm`.** Required-field validation, the dirty/disabled
   Save button, select options loading.
3. **Playwright smoke test.** Sign in → create a family → add a kid → create an order →
   verify the totals. This one test would catch most regressions in the core flow.
4. **`pgTAP` or plain SQL assertions** on the views, especially the join semantics in
   ISSUES #12.

Add `test` and `typecheck` scripts and run them in CI alongside lint (ISSUES #36).

## 7. Better operational output — M

The monthly order is the product; the reports around it are thin.

- **PDF labels** via `@react-pdf/renderer` instead of a print-stylesheet page. Reliable
  margins across browsers, and a real file to email or hand to a volunteer.
- **Avery template presets.** The label page hardcodes 4"×2" / 10-up; make the layout a
  dropdown (Avery 5163, 5164, …).
- **CSV export** from every table (ISSUES #33), plus an order-summary export for the
  warehouse.
- **Packing list per deliverer** — a printable sheet with the families, addresses, and diaper
  counts for one route.
- **Order comparison.** "This month vs. last month: +2 families, −150 size 4." Useful for
  spotting data-entry mistakes before the order is placed.

## 8. Data quality guardrails — S/M

The app currently accepts anything the user types.

- **Validation:** phone number format, 5-digit zip, birth date not in the future, email
  shape. `react-hook-form` supports this natively; add `zod` + `@hookform/resolvers` for one
  schema shared by the form and the type.
- **Zip → city autofill.** `scripts/zipCodes.txt` already exists in the repo.
- **Duplicate detection** on new families — warn on a matching name or address.
- **Diaper-size suggestions.** Age and size correlate; `cellRenderers.birthDate` already
  flags children over three years old in red. Turn that into an actionable "review these
  sizes" list on the New Order page, which is exactly when it matters.
- **Stale-record nudges.** "12 families haven't been reviewed in 6 months."

## 9. Dashboard worth returning to — S/M

`LandingPage` shows three counts and two links. It could answer the questions staff actually
have:

- Next pickup date, with a countdown.
- Last order's totals and a "create this month's order" call to action.
- Diaper demand by size over the last 6 months (see the `dataviz` guidance for chart design).
- Families with no deliverer assigned; deliverers with no families.
- Children aging out of diapers this quarter.

~~Drop the hardcoded hex colors (`#2196f3`, and the `${stat.color}20` alpha-by-string-concat
hack) in favor of theme palette tokens and `alpha()`.~~ ✅ done (2026-08-27) — the stat cards
now key off `info` / `success` / `warning` and `alpha()`, which is what makes the theme switch
above possible. The content items in this section are still open.

## 10. Design system and theming — S

- **Light/dark/system toggle** (ISSUES #31), persisted to `localStorage`. MUI v7's
  `colorSchemes` API handles this cleanly and fixes the print-in-dark-mode problem.
- ~~**A real theme file**~~ — ✅ done (2026-08-27). [`src/theme.ts`](../src/theme.ts) holds
  palette, typography, shape, and component defaults. Button labels are no longer uppercased,
  the AppBar is flat with a hairline border, and `CardActionArea` keeps an explicit
  focus-visible outline. Per-component `sx` repetition is reduced but not gone.
- **Brand identity.** The favicon is the only branding. A proper logo, color palette, and
  typographic scale would make it feel like the org's tool rather than a scaffold.
- **Accessibility pass:** keyboard navigation (ISSUES #32), focus-visible rings, contrast
  audit against WCAG AA on the dark palette, `aria-live` on the toast region, and real labels
  on icon-only buttons.

## 11. Data layer modernization — M

- ~~**TanStack Query**~~ — ✅ done (2026-08-27). Every read hook in `src/hooks/` is now a
  `useQuery`, and every write is a `useMutation` that invalidates what it changed. Keys live
  in one place, [`src/queryClient.ts`](../src/queryClient.ts), so a save on one page updates
  the table on another. This is what structurally fixed "spinner forever on error": a
  rejected query retries twice, then renders `ErrorState`.
  - The 30-second `memoize` on the deliverer options is gone — the option list is a cache entry
    that adding a deliverer invalidates, so a new deliverer appears in the parent form
    immediately. `memoizee` was the only consumer and has been dropped from `package.json`.
  - `useTable`'s realtime subscription patches the query cache with `setQueryData` rather
    than component state.
- **Generated Supabase types** (ISSUES #37) so the `as any` in `supabase.ts:31` and every
  `as unknown as X` at the call sites can go.
- **Migrations** in `supabase/migrations/` (ISSUES #38) so schema changes are reviewable and
  reversible.
- **Postgres functions** for multi-table writes — the order snapshot first (ISSUES #13).

## 12. Bulk operations — M

Everything is one record at a time today.

- Multi-select in `DataGrid` → bulk activate/deactivate/reassign deliverer.
- CSV import for onboarding a batch of families (`scripts/importData.js` does this today as a
  developer-only one-off).
- Reassign all of one deliverer's families to another in a single action — the current flow
  is to edit each family individually, which is the most tedious task in the app.

## 13. Housekeeping — S

- `.env.example` (ISSUES #39), `.nvmrc`, `engines`, and `typecheck` / `format` / `test`
  scripts (ISSUES #40).
- Dependabot or Renovate for dependency updates.
- A `CONTRIBUTING.md` and a `scripts/README.md` explaining when each script is run.
- Bundle analysis — MUI plus DataGrid is heavy, and routes are already lazy-loaded, so
  check what's actually landing in the initial chunk.
- Error monitoring (Sentry free tier) — with volunteer users, nobody is going to file a bug
  report.
