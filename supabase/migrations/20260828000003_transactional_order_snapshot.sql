-- Make the monthly order snapshot atomic, and make a retry harmless (ISSUES #13, #14).
--
-- Before this, NewOrderPage inserted order_record, then order_parent and order_kid in a
-- Promise.all. Two things went wrong with that:
--
--   #13  If either of the latter two failed, the order_record was already committed. The
--        user was navigated into a half-populated order that looked real, and the missing
--        families or children were invisible — the totals were simply wrong.
--
--   #14  order_parent and order_kid had no primary key, only nullable foreign keys. A
--        retried insert (a double-tap, a network retry, a second attempt after a partial
--        failure above) appended a second copy of every row, and the totals double-counted
--        the diapers. For an org that orders against those numbers, that is a real cost.
--
-- Part 1 de-duplicates anything already written that way, then adds the composite keys.
-- Part 2 moves the whole snapshot into one function, so it commits or it does not.

-- ---------------------------------------------------------------------------------------
-- Part 1: composite primary keys
-- ---------------------------------------------------------------------------------------

-- A row with a NULL key half cannot be part of a primary key and cannot be interpreted
-- anyway: an order_kid with no kid_id names no child. Nothing should have written one, but
-- the columns allowed it, so check rather than assume.
DELETE FROM order_parent WHERE order_id IS NULL OR parent_id IS NULL;
DELETE FROM order_kid WHERE order_id IS NULL OR kid_id IS NULL;

-- Collapse duplicates to one row per key. ctid is the physical row identifier, which is the
-- only thing that distinguishes two otherwise identical rows in a table with no key.
DELETE FROM order_parent a
USING order_parent b
WHERE a.ctid > b.ctid
  AND a.order_id = b.order_id
  AND a.parent_id = b.parent_id;

DELETE FROM order_kid a
USING order_kid b
WHERE a.ctid > b.ctid
  AND a.order_id = b.order_id
  AND a.kid_id = b.kid_id;

ALTER TABLE order_parent
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN parent_id SET NOT NULL;

ALTER TABLE order_kid
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN kid_id SET NOT NULL;

ALTER TABLE order_parent
  ADD CONSTRAINT order_parent_pkey PRIMARY KEY (order_id, parent_id);

ALTER TABLE order_kid
  ADD CONSTRAINT order_kid_pkey PRIMARY KEY (order_id, kid_id);

-- The primary keys index (order_id, …) leading, which is what the order views join on
-- (ISSUES #42 for the rest of the foreign keys).

-- ---------------------------------------------------------------------------------------
-- Part 2: one transactional snapshot
-- ---------------------------------------------------------------------------------------

-- The client passes the rows it already computed rather than the function rebuilding the
-- roster from the tables. That is deliberate: the diaper-quantity rule lives in
-- src/utils/calcDiaperSizes.ts and is unit-tested there, and reimplementing it in SQL would
-- give this app two sources of truth for the one number the whole order is measured by.
-- What the function is here to provide is atomicity, not a second opinion.
--
-- SECURITY INVOKER (the default — deliberately NOT definer): the RLS policies on
-- order_record, order_parent, and order_kid still apply to the caller, so this function
-- grants no ability a readOnly user did not already have. Do not change that without
-- re-reading CLAUDE.md §4.
CREATE OR REPLACE FUNCTION public.create_order(
  order_data JSONB,
  parents JSONB,
  kids JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  new_order_id UUID;
BEGIN
  IF parents IS NULL OR jsonb_array_length(parents) = 0 THEN
    RAISE EXCEPTION 'An order must include at least one family';
  END IF;

  INSERT INTO public.order_record (date_of_order, date_of_pickup, notes)
  VALUES (
    (order_data ->> 'date_of_order')::DATE,
    (order_data ->> 'date_of_pickup')::DATE,
    NULLIF(order_data ->> 'notes', '')
  )
  RETURNING id INTO new_order_id;

  INSERT INTO public.order_parent (order_id, parent_id, deliverer_id)
  SELECT
    new_order_id,
    (p ->> 'parent_id')::UUID,
    NULLIF(p ->> 'deliverer_id', '')::UUID
  FROM jsonb_array_elements(parents) AS p;

  INSERT INTO public.order_kid (order_id, kid_id, diaper_size, diaper_quantity)
  SELECT
    new_order_id,
    (k ->> 'kid_id')::UUID,
    k ->> 'diaper_size',
    (k ->> 'diaper_quantity')::NUMERIC
  FROM jsonb_array_elements(kids) AS k;

  RETURN new_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(JSONB, JSONB, JSONB) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_order(JSONB, JSONB, JSONB) TO authenticated;
