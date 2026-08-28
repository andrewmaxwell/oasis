-- Ordering belongs in the view, not in each page that reads it.
--
-- Two views were out of step with parent_view's `ORDER BY p.is_active DESC, first, last`:
--
-- 1. kid_view ordered by birth date, so children who have aged out of the program were
--    scattered through the roster the staff works from every month. Active first, then
--    alphabetically — the same rule the families list already follows. Birth date is still
--    a sortable column in the UI for anyone who wants it.
--
-- 2. deliverer_options ordered by `is_active` ASC, and false sorts before true in Postgres
--    — so every retired volunteer was listed ABOVE the active ones in the "Planned
--    Deliverer" dropdown on the family form. Almost certainly a missing DESC.
--
-- Both are plain view redefinitions: no data changes, no policy changes. The views are
-- security_invoker, so the RLS policies on the underlying tables still apply unchanged.

DROP VIEW IF EXISTS kid_view;
CREATE VIEW kid_view WITH (security_invoker = ON) AS
SELECT
  k.id,
  k.first_name || ' ' || k.last_name as name,
  k.gender,
  k.birth_date,
  k.diaper_size,
  k.is_active,
  k.notes,
  parent_id,
  p.first_name || ' ' || p.last_name as parent_name
FROM kid k
JOIN parent p 
  ON p.id = k.parent_id
WHERE 
  NOT k.is_deleted
  AND NOT p.is_deleted
ORDER BY k.is_active DESC, k.first_name, k.last_name;

DROP VIEW IF EXISTS deliverer_options;
CREATE VIEW deliverer_options WITH (security_invoker = ON) AS
SELECT
 id as value,
 CASE
  WHEN is_active THEN name
  ELSE name || ' (INACTIVE)'
 END AS label
FROM deliverer
WHERE NOT is_deleted
ORDER BY is_active DESC, name;
