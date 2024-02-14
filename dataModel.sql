-- use the output of scripts/generateTriggersAndPolicies.js to add triggers, policies, and grants

CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TABLE IF EXISTS parent CASCADE;
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

DROP TABLE IF EXISTS kid CASCADE;
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

DROP TABLE IF EXISTS order_record CASCADE;
CREATE TABLE order_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_of_order DATE NOT NULL,
    date_of_pickup DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

DROP TABLE IF EXISTS order_parent CASCADE;
CREATE TABLE order_parent (
    order_id UUID REFERENCES order_record(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parent(id),
    deliverer_id UUID REFERENCES deliverer(id)
);

DROP TABLE IF EXISTS order_kid CASCADE;
CREATE TABLE order_kid (
    order_id UUID REFERENCES order_record(id) ON DELETE CASCADE,
    kid_id UUID REFERENCES kid(id),
    diaper_size TEXT NOT NULL,
    diaper_quantity NUMERIC
);

DROP VIEW IF EXISTS parent_view;
CREATE VIEW parent_view AS
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
CREATE VIEW finished_order_view AS
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
  AND NOT d.is_deleted
LEFT JOIN parent p 
  ON op.parent_id = p.id 
  AND NOT p.is_deleted
LEFT JOIN kid k 
  ON k.parent_id = op.parent_id 
  AND NOT k.is_deleted
LEFT JOIN order_kid ok 
  ON ok.kid_id = k.id 
  AND ok.order_id = op.order_id
GROUP BY op.parent_id, p.id, op.deliverer_id, d.id, op.order_id
ORDER BY op.order_id, p.first_name, p.last_name;

DROP VIEW IF EXISTS kid_view;
CREATE VIEW kid_view AS
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
ORDER BY k.birth_date ASC, k.first_name, k.last_name;

DROP VIEW IF EXISTS parent_options;
CREATE VIEW parent_options AS
SELECT 
  id as value,
  first_name || ' ' || last_name as label
FROM parent
WHERE NOT is_deleted
ORDER BY first_name, last_name;

DROP VIEW IF EXISTS deliverer_options;
CREATE VIEW deliverer_options AS
SELECT
 id as value,
 CASE
  WHEN is_active THEN name
  ELSE name || ' (INACTIVE)'
 END AS label
FROM deliverer
WHERE NOT is_deleted
ORDER BY is_active, name;

-- use the output of scripts/generateTriggersAndPolicies.js to add triggers, policies, and grants