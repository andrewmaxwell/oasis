# Security fix deployment — status

Applied to the hosted project (`lsagjnicdssonuenzunb`) on **2026-08-27**.

| # | Step | Status |
|---|------|--------|
| 1 | Move `access_level` to `app_metadata` | ✅ applied |
| 2 | Deploy the authorizing edge function | ✅ deployed & verified |
| 3 | Apply RLS policies | ✅ applied & verified |
| 4 | **Turn off public signup in the dashboard** | ❌ **OUTSTANDING — signup is open** |
| 5 | Deploy the client | ⬜ on next push to `main` |
| 6 | Rotate the anon key | ⬜ recommended |

---

## 4. Turn off public signup — the one thing still open

**Verified open on 2026-08-27:** a `POST /auth/v1/signup` with the public anon key
successfully created an account. Anyone who reads the deployed JavaScript can register.

Fix it here: **Authentication → Sign In / Providers → Email → "Allow new users to sign up" →
off.**

`supabase/config.toml` sets `enable_signup = false`, but that file only governs local
development. `npx supabase config push` would apply it — **do not run it**: it pushes the
whole local config, including `site_url = "http://127.0.0.1:3000"`, which would point every
invite and password-reset link at localhost, and may clobber remote SMTP and provider
settings that aren't represented locally.

RLS now limits the damage — an account with no assigned access level can neither read nor
write (verified below) — but an open registration endpoint on an app holding refugee family
PII should still be closed.

## 5. Deploy the client

Push to `main`; GitHub Actions builds and publishes. The client now reads `access_level`
from `app_metadata` and routes invite/recovery arrivals to the password form.

## 6. Rotate the anon key (recommended)

The anon key is in git history from before commit `298466a` (ISSUES #6). Anon keys are public
by design, so this is hygiene — but it was effectively an admin credential for as long as
issue #1 was live. Rotate it in the dashboard, then update the `VITE_SUPABASE_KEY` repo
secret and your local `.env`.

---

## What was verified

**The anon key can no longer reach the edge function.** With the old code this returned the
full user list:

```
POST /functions/v1/user-management  {"action":"listUsers"}
Authorization: Bearer <ANON_KEY>
→ HTTP 401 {"error":"Invalid or expired token"}
```

Arbitrary method dispatch (`{"action":"signOut"}`) is likewise refused.

**The anon key cannot read any PII.** `parent`, `kid`, `deliverer`, `parent_view`, and
`finished_order_view` all return `HTTP 401 permission denied`.

**Policy state:** all six tables have RLS enabled with four policies each
(select/insert/update/delete); zero copies of the old blanket `access_for_logged_in_users`
policy remain.

**Access-level resolution**, tested against the live functions:

| Case | Result |
|---|---|
| admin holding a pre-migration token | `admin`, can write |
| readOnly holding a pre-migration token | `readOnly` |
| account with no level assigned (self-registered) | `NULL`, cannot read |

That first row matters: `public.app_access_level()` reads the JWT claim and **falls back to
looking the user up in `auth.users`**, so a stale token resolves correctly. There is no
window in which legitimate users lose access, and no need to make anyone sign out and back in.

## Still worth doing by hand

**Test the invite flow end to end.** It replaced the hardcoded password, so it is now the
only way a new user can get in. Invite a throwaway address, click the link, and confirm you
land on Change Password rather than the dashboard or a blank page. Set a password, sign out,
sign back in.

If the link points at the wrong host, fix **Authentication → URL Configuration → Site URL**;
it must be the GitHub Pages URL in production.

**Confirm a read-only user cannot write.** Sign in as one and try to save a family; expect a
row-level-security error.

## Migrations

This work put the project on Supabase migrations (previously `dataModel.sql` was applied by
hand — ISSUES #38). Applied so far:

```
20260827000001_access_level_to_app_metadata.sql
20260827000002_rls_policies.sql
20260827000003_remove_signup_probe_account.sql
20260827000004_restrict_reads_to_assigned_levels.sql
```

`20260827000002` and `20260827000004` are generated — regenerate rather than hand-editing:

```bash
node scripts/generateTriggersAndPolicies.js > supabase/migrations/<timestamp>_policies.sql
npx supabase db push
```

Note `dataModel.sql` is **not** yet a migration and still contains `DROP TABLE … CASCADE`
(ISSUES #10, #11). Do not run it against production.
