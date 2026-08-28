-- use the output of scripts/generateTriggersAndPolicies.js to add triggers, policies, and grants

CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drops are grouped here in reverse dependency order, and the tables below are created
-- in dependency order, so this file re-runs cleanly (ISSUES #11).
DROP TABLE IF EXISTS order_kid CASCADE;
DROP TABLE IF EXISTS order_parent CASCADE;
DROP TABLE IF EXISTS order_record CASCADE;
DROP TABLE IF EXISTS kid CASCADE;
DROP TABLE IF EXISTS parent CASCADE;
DROP TABLE IF EXISTS deliverer CASCADE;

CREATE TABLE deliverer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

CREATE TABLE parent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    phone_number TEXT,
    country_of_origin TEXT,
    rough_family_income NUMERIC,
    deliverer_id UUID REFERENCES deliverer(id) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

CREATE TABLE kid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT,
    birth_date DATE,
    diaper_size TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

CREATE TABLE order_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_of_order DATE NOT NULL,
    date_of_pickup DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

-- The composite primary keys are what make a retried snapshot harmless: a second attempt
-- conflicts instead of appending a duplicate row and double-counting the diapers.
CREATE TABLE order_parent (
    order_id UUID NOT NULL REFERENCES order_record(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parent(id),
    deliverer_id UUID REFERENCES deliverer(id),
    PRIMARY KEY (order_id, parent_id)
);

CREATE TABLE order_kid (
    order_id UUID NOT NULL REFERENCES order_record(id) ON DELETE CASCADE,
    kid_id UUID NOT NULL REFERENCES kid(id),
    diaper_size TEXT NOT NULL,
    diaper_quantity NUMERIC,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (order_id, kid_id)
);

DROP VIEW IF EXISTS parent_view;
CREATE VIEW parent_view WITH (security_invoker = ON) AS
SELECT
  p.id,
  p.first_name || ' ' || p.last_name as name,
  p.address,
  p.city,
  p.zip,
  p.phone_number,
  p.deliverer_id,
  d.name as deliverer_name,
  p.is_active,
  COALESCE(json_agg(k.diaper_size) FILTER (WHERE k.diaper_size IS NOT NULL), '[]'::json) as diaper_sizes
FROM parent p
  LEFT JOIN deliverer d 
    ON p.deliverer_id = d.id 
    AND NOT d.is_deleted 
    AND d.is_active
  LEFT JOIN kid k 
    ON p.id = k.parent_id 
    AND NOT k.is_deleted 
    AND k.is_active
WHERE NOT p.is_deleted
GROUP BY p.id, d.id
ORDER BY p.is_active DESC, p.first_name, p.last_name;

DROP VIEW IF EXISTS finished_order_view;
CREATE VIEW finished_order_view WITH (security_invoker = ON) AS
SELECT
  op.order_id,
  op.parent_id,
  p.first_name || ' ' || p.last_name as parent_name,
  p.address,
  p.city,
  p.zip,
  p.phone_number,
  op.deliverer_id,
  d.name as deliverer_name,
  d.email as deliverer_email,
  COALESCE(json_agg(ok) FILTER (WHERE ok IS NOT NULL), '[]'::json) as order_kids
FROM order_parent op
LEFT JOIN deliverer d 
  ON d.id = op.deliverer_id 
LEFT JOIN parent p 
  ON op.parent_id = p.id 
LEFT JOIN kid k 
  ON k.parent_id = op.parent_id 
LEFT JOIN order_kid ok 
  ON ok.kid_id = k.id 
  AND ok.order_id = op.order_id
GROUP BY op.parent_id, p.id, op.deliverer_id, d.id, op.order_id
ORDER BY op.order_id, p.first_name, p.last_name;

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

DROP VIEW IF EXISTS parent_options;
CREATE VIEW parent_options WITH (security_invoker = ON) AS
SELECT 
  id as value,
  first_name || ' ' || last_name as label
FROM parent
WHERE NOT is_deleted
ORDER BY first_name, last_name;

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

DROP VIEW IF EXISTS kid_order_view;
CREATE VIEW kid_order_view WITH (security_invoker = ON) AS
SELECT 
  ok.order_id as id,
  ok.kid_id,
  ok.diaper_size,
  ok.diaper_quantity,
  o.date_of_order,
  o.notes AS order_notes
FROM order_kid ok
LEFT JOIN order_record o 
  ON o.id = ok.order_id
WHERE NOT ok.is_deleted
AND NOT o.is_deleted
ORDER BY o.date_of_order DESC;

DROP VIEW IF EXISTS parent_order_view;
CREATE VIEW parent_order_view WITH (security_invoker = ON) AS
SELECT
  o.id,
  o.date_of_order,
  o.notes as order_notes,
  op.parent_id,
  op.deliverer_id,
  d.name as deliverer_name,
  COALESCE(json_agg(ok) FILTER (WHERE ok IS NOT NULL), '[]'::json) as order_kids
FROM order_parent op
LEFT JOIN deliverer d 
  ON d.id = op.deliverer_id 
LEFT JOIN kid k 
  ON k.parent_id = op.parent_id 
-- The is_deleted predicate belongs in ON, not WHERE: in WHERE it evaluates to NULL for
-- outer-joined rows with no match and drops the family entirely (ISSUES #12).
LEFT JOIN order_kid ok 
  ON ok.kid_id = k.id 
  AND ok.order_id = op.order_id
  AND ok.is_deleted IS NOT TRUE
LEFT JOIN order_record o
  ON o.id = op.order_id
WHERE NOT o.is_deleted
GROUP BY o.id, op.parent_id, op.deliverer_id, d.name
ORDER BY o.date_of_order DESC;


-- The monthly order snapshot, as one transaction (ISSUES #13). Three separate inserts left
-- a committed order_record behind whenever the parent or kid inserts failed, and navigated
-- the user into that half-built order as if it were complete.
--
-- The client passes the rows it already computed rather than this function rebuilding the
-- roster: the diaper-quantity rule lives in src/utils/calcDiaperSizes.ts and is unit-tested
-- there, and a SQL reimplementation would be a second source of truth for the one number
-- the whole order is measured by. Atomicity is what this adds, not a second opinion.
--
-- SECURITY INVOKER (the default — deliberately NOT definer) so the RLS policies on the
-- three tables still apply to the caller. See CLAUDE.md §4.
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


-- use the output of scripts/generateTriggersAndPolicies.js to add triggers, policies, and grants