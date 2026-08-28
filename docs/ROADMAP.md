# Roadmap — Enhancements

What to *build*. Defects are tracked separately in [ISSUES.md](ISSUES.md).

Each item notes rough effort (S/M/L) and why it's worth doing for **this** app — a
small-team, mobile-heavy, PII-holding non-profit tool.

## Priority order, if you only do a few things

1. **§3 Mobile**, starting with the deliverer view. The delivery-day use case — the one a
   volunteer has in a car, mid-route — is the only major workflow the app doesn't support.
2. **§6.3 Playwright smoke test.** `OasisForm` is covered now; the core flow end-to-end is
   not, and ISSUES #44 (the `react-router` advisories) is waiting on exactly this before the
   bump can be made safely.
3. **§5 Restore and undo.** Soft-deleted records are invisible in the app today, so a
   misclick needs a developer with SQL access.

## Done

- **§1 Navigation** (2026-08-27) — [`OasisNav.tsx`](../src/components/OasisNav.tsx) renders
  Dashboard · Families · Kids · Deliverers · Orders, plus Users for admins: AppBar buttons at
  `md` and up, hamburger `Drawer` below, active section marked with `aria-current`. Closes
  ISSUES #24 and #32. *Breadcrumbs are still open — see §1 below.*
- **§2 Error, loading, and feedback layer** (2026-08-27) — toast provider, error boundary,
  skeleton loaders, empty states, inline error + retry, and promise-based confirmations.
  `alert()` and `confirm()` are gone from `src/`. Closes ISSUES #9, #25, #27, #28.
  *Optimistic updates are still open — see §2 below.*
- **§11 TanStack Query migration** (2026-08-27) — every read is a `useQuery`, every write a
  `useMutation` that invalidates what it changed, with all keys in
  [`queryClient.ts`](../src/queryClient.ts). This is what structurally fixed "spinner forever
  on error". Dropped `memoizee`. *Generated types, Postgres functions still open — see §11.*
- **§6.1 Unit tests on `src/utils/`** (2026-08-27) — Vitest, 46 tests, `npm test` in CI.
  *Everything above `src/utils/` is still untested — see §6.*
- **§6.2 Component tests on `OasisForm`** (2026-08-28) — `jsdom` + React Testing Library,
  a `renderForm` harness in [`src/test/`](../src/test/renderForm.tsx) supplying the data
  router / confirm / query providers the form needs, and 17 tests over validation, the Save
  button's dirty and submitting states, `OptionSource` cache sharing, and the
  unsaved-changes blocker. Filed ISSUES #45 along the way. *§6.3 and §6.4 still open.*
- **§10 A real theme file** (2026-08-27) — [`src/theme.ts`](../src/theme.ts) holds palette,
  typography, shape, and component defaults; `LandingPage`'s stat cards key off palette
  tokens and `alpha()` rather than hardcoded hex. *Light mode is still open — see §10.*

---

## 1. Real navigation — S — mostly done

**Still open:** breadcrumbs — `Families › Amara Okafor › Chidi` — replacing the ad-hoc "Back
to Parent" buttons on each page, which currently guess wrong when you arrived from the Kids
table rather than from a parent.

## 2. Error, loading, and feedback — M — done

**Still open:** **optimistic updates** on toggles like `is_active`, with rollback on failure.
The `onMutate`/`onError` rollback pattern is available now but not used anywhere.

## 3. Mobile and offline — M/L

Deliverers use this in a car. Today it's a desktop app rendered small (ISSUES #30).

- **A deliverer-focused view.** Rather than making the admin UI work on a phone, add a
  `/deliverer/:id/order/:orderId` route: just my families, in delivery order, with tap-to-map,
  tap-to-call, and a "delivered" checkbox. This is arguably the highest-value new feature in
  the whole list.
- **Responsive tables.** Below the `md` breakpoint, swap `DataGrid` for a stacked card list:
  name, address, phone, diaper summary. `cellRenderers` already has `mapAnchor` and `tel:`
  anchors — surface them as proper touch targets.
- **PWA.** `vite-plugin-pwa` gives an installable app with a home-screen icon. Cache the app
  shell and the current order's delivery list so a route sheet survives losing signal.

## 4. Server-side email instead of `mailto:` — M

`generateEmails` is popup-blocked and length-limited (ISSUES #17). Move sending into a
Supabase edge function using Resend or SendGrid: proper HTML email with a formatted delivery
table, one click to every deliverer, a record of what was sent and when, and a
preview-before-send dialog. Optionally attach the label PDF (§7).

## 5. Restore, audit, and data safety — M

- **Restore UI.** Soft-deleted records are recoverable in the database but invisible in the
  app. Add an admin "Recently deleted" view with a Restore button.
- **Undo toast.** "Family deleted · UNDO" for 10 seconds covers the common misclick without
  needing the admin screen. The toast layer already supports one inline action.
- **Audit log.** `created_by` / `modified_by` columns plus a `change_log` table, populated by
  trigger. Given the PII involved (ISSUES #43), closer to a requirement than a nice-to-have.
- **Field-level permissions.** `rough_family_income` and `country_of_origin` are the most
  sensitive columns; consider restricting them to `admin`.

## 6. Testing — M — §6.1 and §6.2 done

`src/utils/` (46 tests) and `OasisForm` (17 tests) are covered — 63 in all. The RTL harness
is in place now, so a new component test is a file, not a project. Remaining, in value order:

3. **Playwright smoke test.** Sign in → create a family → add a kid → create an order →
   verify the totals. This one test would catch most regressions in the core flow, and would
   unblock the `react-router` bump (ISSUES #44).
4. **`pgTAP` or plain SQL assertions** on the views. The `LEFT JOIN` semantics that caused
   ISSUES #12 are fixed but unguarded — nothing would catch the same mistake in the next view.

## 7. Better operational output — M

The monthly order is the product; the reports around it are thin.

- **PDF labels** via `@react-pdf/renderer` instead of a print stylesheet — reliable margins
  across browsers, and a real file to email or hand to a volunteer.
- **Avery template presets.** The label page hardcodes 4"×2" / 10-up; make it a dropdown.
- **CSV export** from every table (ISSUES #33), plus an order-summary export for the warehouse.
- **Packing list per deliverer** — a printable sheet with the families, addresses, and diaper
  counts for one route.
- **Order comparison.** "This month vs. last month: +2 families, −150 size 4." Useful for
  spotting data-entry mistakes before the order is placed.

## 8. Data quality guardrails — S/M

The app currently accepts anything the user types.

- **Validation:** phone format, 5-digit zip, birth date not in the future, email shape.
  `react-hook-form` supports this natively; add `zod` + `@hookform/resolvers` for one schema
  shared by the form and the type.
- **Zip → city autofill.** `scripts/zipCodes.txt` already exists in the repo.
- **Duplicate detection** on new families — warn on a matching name or address.
- **Diaper-size suggestions.** `cellRenderers.birthDate` already flags children over three in
  red. Turn that into an actionable "review these sizes" list on the New Order page, which is
  exactly when it matters.
- **Stale-record nudges.** "12 families haven't been reviewed in 6 months."

## 9. Dashboard worth returning to — S/M

`LandingPage` shows three counts and two links. It could answer the questions staff actually
have:

- Next pickup date, with a countdown.
- Last order's totals and a "create this month's order" call to action.
- Diaper demand by size over the last 6 months (see the `dataviz` guidance for chart design).
- Families with no deliverer assigned; deliverers with no families.
- Children aging out of diapers this quarter.

## 10. Design system and theming — S

- **Light/dark/system toggle** (ISSUES #31), persisted to `localStorage`. MUI v7's
  `colorSchemes` API handles this cleanly and fixes the print-in-dark-mode problem.
- **Brand identity.** The favicon is the only branding. A logo, color palette, and
  typographic scale would make it feel like the org's tool rather than a scaffold.
- **Accessibility pass:** focus-visible rings, contrast audit against WCAG AA on the dark
  palette, `aria-live` on the toast region, real labels on icon-only buttons.

## 11. Data layer modernization — M — TanStack Query done

- **Generated Supabase types** (ISSUES #37) so the `as any` in `supabase.ts` and every
  `as unknown as X` at the call sites can go.
- **Postgres functions** for multi-table writes — the order snapshot first (ISSUES #13).

## 12. Bulk operations — M

Everything is one record at a time today.

- Multi-select in `DataGrid` → bulk activate/deactivate/reassign deliverer.
- CSV import for onboarding a batch of families (`scripts/importData.js` does this today as a
  developer-only one-off).
- Reassign all of one deliverer's families to another in a single action — the current flow
  is to edit each family individually, which is the most tedious task in the app.

## 13. Housekeeping — S

- `.env.example` (ISSUES #39), `.nvmrc`, `engines`, and a `format` script (ISSUES #40).
- Dependabot or Renovate for dependency updates.
- A `CONTRIBUTING.md` and a `scripts/README.md` explaining when each script is run.
- Bundle analysis — MUI plus DataGrid is heavy and the build already warns about a >500 kB
  chunk; routes are lazy-loaded, so check what's landing in the initial chunk.
- Error monitoring (Sentry free tier) — with volunteer users, nobody files a bug report.
