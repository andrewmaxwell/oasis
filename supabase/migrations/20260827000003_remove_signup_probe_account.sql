-- Removes the throwaway account created on 2026-08-27 while verifying whether public
-- signup was open on the hosted project. It was (see docs/SECURITY-FIX-DEPLOY.md step 4).
-- Idempotent: matches nothing on a fresh database.
DELETE FROM auth.users WHERE email LIKE 'rls-probe-%@andrewmaxwell.dev';
