# Roadmap — Enhancements

What to *build*. Defects are tracked in [ISSUES.md](ISSUES.md). Each item notes rough effort
(S/M/L) and why it's worth doing for **this** app — a small-team, mobile-heavy, PII-holding
non-profit tool.

## Priority order, if you only do a few things

1. **§5's undo toast** — S. The toast layer already takes one inline action, so
   "Family deleted · UNDO" is an afternoon, and it covers the misclick that today needs a
   developer with SQL access. The full restore screen can wait behind it.
2. **ISSUES #49, the idle timeout** — S. Not an enhancement, but it belongs in any list of
   what to do next: unattended devices are the realistic way this roster leaks.
3. **§8 validation** — S/M. The only item here that prevents bad data rather than reacting
   to it. A mistyped address is a delivery that fails silently.
4. **§14 order corrections** — M. The snapshot is the product and it is currently immutable;
   reality between snapshot and pickup has nowhere to go.
5. **§6.4 SQL assertions on the views** — M. The one real gap the E2E mock leaves open.

**Open question (with Selia, 2026-08-28):** whether deliverers should use the app at all,
and how they should get their assignments. §3's deliverer view and §4's server-side email are
both downstream of that answer — don't build either until it lands.

## Done

- **§1 Navigation** (08-27) — [`OasisNav.tsx`](../src/components/OasisNav.tsx): AppBar links
  at `md`+, hamburger below, `aria-current` on the active section. ISSUES #24, #32.
  *Breadcrumbs still open — §1.*
- **§2 Error, loading, and feedback** (08-27) — toasts, error boundary, skeletons, empty
  states, inline retry, promise-based confirms. `alert()` and `confirm()` are gone from
  `src/`. ISSUES #9, #25, #27, #28. *Optimistic updates still open — §2.*
- **§11 TanStack Query** (08-27) — every read a `useQuery`, every write a `useMutation` that
  invalidates what it changed, all keys in [`queryClient.ts`](../src/queryClient.ts). What
  structurally fixed "spinner forever on error". *Generated types still open — §11.*
- **§6.1–6.3 Tests** (08-27/28) — 66 unit tests over `src/utils/` and `OasisForm`, plus four
  Playwright specs ([`e2e/`](../e2e/)) covering the core flow, mobile layout, list ordering,
  and the dashboard counts, against a network-level Supabase mock — no Docker, no secrets.
  *§6.4 still open, and more valuable now that the mock does not run the real views.*
- **§10 Theme file** (08-27) — [`theme.ts`](../src/theme.ts) holds palette, typography,
  shape, and component defaults. *Light mode still open — §10.*

---

## 1. Navigation — S — mostly done

**Still open:** breadcrumbs — `Families › Amara Okafor › Chidi` — replacing the ad-hoc "Back
to Parent" buttons, which guess wrong when you arrived from the Kids table.

## 2. Feedback — M — done

**Still open:** optimistic updates on toggles like `is_active`, with rollback on failure. The
`onMutate`/`onError` pattern is available but unused.

## 3. Mobile and offline — M/L — *gated on the deliverer question above*

The admin UI fits a phone now (ISSUES #30), but it is still a desktop app made narrow.

- **A deliverer-focused view** — `/deliverer/:id/order/:orderId`: just my families, in
  delivery order, tap-to-map, tap-to-call, a "delivered" checkbox. Worth building only if
  deliverers are actually going to open the app.
- **Stacked card list** below `sm` instead of the `DataGrid`, so `mapAnchor` and the `tel:`
  links become real touch targets rather than text in a cell.
- **PWA** via `vite-plugin-pwa` — installable, and a route sheet that survives losing signal.

## 4. Deliverer notifications — M — *gated on the deliverer question above*

`generateEmails` is popup-blocked and length-limited (ISSUES #17). The stopgap is a dialog
with per-deliverer buttons; the real fix is a Supabase edge function sending through Resend
or SendGrid — formatted HTML, a record of what was sent and when, and a preview before
sending. SMS may fit this audience better than email; that's part of the open question.

## 5. Restore, audit, and data safety — M

- **Undo toast.** "Family deleted · UNDO" for 10 seconds. Priority #1 above.
- **Restore UI.** An admin "Recently deleted" view with a Restore button — soft-deleted
  records are recoverable in the database but invisible in the app.
- **Audit log.** `created_by` / `modified_by` plus a `change_log` table by trigger. Given the
  PII (ISSUES #43), closer to a requirement than a nice-to-have.
- **Field-level permissions.** `rough_family_income` and `country_of_origin` are the most
  sensitive columns; consider restricting them to `admin`.

## 6. Testing — M — §6.1–6.3 done

**§6.4:** `pgTAP` or plain SQL assertions on the views. The `LEFT JOIN` semantics behind
ISSUES #12 are fixed but unguarded, and the E2E suite reimplements the views in TypeScript
rather than running them — so a view can drift from its mock and the suite stays green. Also
untested: the query layer and each page's loading/error branches (ISSUES #35).

## 7. Better operational output — M

- **PDF labels** via `@react-pdf/renderer` — reliable margins across browsers, and a real
  file to email. **Avery presets** instead of the hardcoded 4"×2" / 10-up.
- **CSV export** from every table (ISSUES #33), plus an order summary for the warehouse.
- **Packing list per deliverer** — one printable sheet per route.
- **Order comparison.** "+2 families, −150 size 4 vs. last month" catches data-entry mistakes
  before the order is placed.

## 8. Data quality guardrails — S/M

The app accepts anything typed into it.

- **Validation:** phone format, 5-digit zip, birth date not in the future, email shape. Add
  `zod` + `@hookform/resolvers` for one schema shared by the form and the type.
- **Zip → city autofill.** `scripts/zipCodes.txt` is already in the repo.
- **Duplicate detection** on new families — warn on a matching name or address.
- **Diaper-size review list** on the New Order page. `cellRenderers.birthDate` already flags
  children over three; surface that where it matters.
- **Stale-record nudges.** "12 families haven't been reviewed in 6 months."

## 9. Dashboard worth returning to — S/M

Three counts and two links today. It could answer the questions staff actually have: next
pickup date with a countdown; last order's totals and a "create this month's order" button;
demand by size over six months (see the `dataviz` guidance); families with no deliverer and
deliverers with no families; children aging out this quarter.

Whatever gets added, it has to agree with the lists it summarizes — that was ISSUES #8 and
again #48. Count through a view that encodes the same rule the list and the order use.

## 10. Design system and theming — S

- **Light/dark/system toggle** (ISSUES #31) via MUI's `colorSchemes`, persisted to
  `localStorage`. Also fixes printing in dark mode.
- **Brand identity.** The favicon is the only branding today.
- **Accessibility pass:** contrast audit against WCAG AA, `aria-live` on the toast region,
  real labels on icon-only buttons. *Started: ISSUES #45 and #29.*

## 11. Data layer — M — TanStack Query done

**Generated Supabase types** (ISSUES #37), so the `as any` in `supabase.ts` and every
`as unknown as X` at the call sites can go. Multi-table writes belong in Postgres functions —
done for the order snapshot; the same shape suits a bulk reassign (§12).

## 12. Bulk operations — M

Everything is one record at a time. Multi-select in `DataGrid` → bulk
activate/deactivate/reassign. CSV import for onboarding a batch of families
(`scripts/importData.js` does this as a developer-only one-off). Reassigning one deliverer's
families to another is the most tedious task in the app.

## 13. Housekeeping — S

Dependabot or Renovate. A `CONTRIBUTING.md` and a `scripts/README.md`. Bundle analysis — MUI
plus DataGrid is heavy and the build warns about a >500 kB chunk. Error monitoring (Sentry
free tier); with volunteer users, nobody files a bug report.

## 14. Order corrections — M

An order is immutable once created: `supabase.ts` has no write path to `order_parent` or
`order_kid` outside the `create_order` RPC, so the only way to fix one is to delete it and
rebuild, losing the notes and dates. But the month moves — a family relocates, a child ages
out, a deliverer drops. Wanted, in order of demand:

- Remove a family from this order, and add one that was missed.
- Correct a size or quantity on one child *for this order only*, without touching the roster.
- Reassign a deliverer within a placed order.

Each is a small transactional Postgres function alongside `create_order`, and each has to
keep the snapshot's whole point intact: editing an order must never write back to `parent`,
`kid`, or `deliverer`.
