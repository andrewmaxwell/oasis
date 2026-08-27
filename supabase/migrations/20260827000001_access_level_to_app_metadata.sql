-- Move `access_level` from user_metadata to app_metadata.
--
-- WHY: user_metadata is writable by the user themselves via
-- supabase.auth.updateUser({data: {...}}), so any signed-in user could previously grant
-- themselves `access_level: 'admin'`. app_metadata can only be written with the service
-- role key, so it is safe to authorize against.
--
-- Additive and idempotent: existing levels are preserved, anyone without one defaults to
-- readOnly. It does not change any behavior on its own — the edge function and the RLS
-- policies are what start reading app_metadata.

UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
       'access_level',
       COALESCE(NULLIF(raw_user_meta_data ->> 'access_level', ''), 'readOnly')
     )
WHERE raw_app_meta_data ->> 'access_level' IS NULL;

-- Report the result. At least one account must end up as 'admin' or nobody will be able to
-- manage users once the edge function starts enforcing.
DO $$
DECLARE
  rec RECORD;
  admin_count INT;
BEGIN
  RAISE NOTICE '--- access levels after migration ---';
  FOR rec IN
    SELECT email, raw_app_meta_data ->> 'access_level' AS level
    FROM auth.users ORDER BY email
  LOOP
    RAISE NOTICE '  % => %', rec.email, rec.level;
  END LOOP;

  SELECT count(*) INTO admin_count
  FROM auth.users WHERE raw_app_meta_data ->> 'access_level' = 'admin';

  RAISE NOTICE '--- admin accounts: % ---', admin_count;
  IF admin_count = 0 THEN
    RAISE WARNING 'NO ADMIN ACCOUNTS. Promote one before applying the RLS migration.';
  END IF;
END $$;
