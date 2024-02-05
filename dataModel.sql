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
    phone_number TEXT NOT NULL,
    country_of_origin TEXT NOT NULL,
    rough_family_income NUMERIC,
    deliverer_id UUID REFERENCES deliverer(id),
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TRIGGER update_parent_modified_at
BEFORE UPDATE ON parent
FOR EACH ROW
EXECUTE FUNCTION update_modified_at();

DROP TABLE IF EXISTS kid CASCADE;
CREATE TABLE kid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    birth_date DATE NOT NULL,
    diaper_size TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TRIGGER update_kid_modified_at
BEFORE UPDATE ON kid
FOR EACH ROW
EXECUTE FUNCTION update_modified_at();

DROP TABLE IF EXISTS deliverer CASCADE;
CREATE TABLE deliverer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TRIGGER update_deliverer_modified_at
BEFORE UPDATE ON deliverer
FOR EACH ROW
EXECUTE FUNCTION update_modified_at();

DROP TABLE IF EXISTS order_record CASCADE;
CREATE TABLE order_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_of_order DATE NOT NULL,
    date_of_pickup DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TRIGGER update_order_record_modified_at
BEFORE UPDATE ON order_record
FOR EACH ROW
EXECUTE FUNCTION update_modified_at();

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

-- DROP TABLE IF EXISTS oasis_users CASCADE;
-- CREATE TABLE oasis_users (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     email TEXT NOT NULL,
--     is_admin BOOLEAN NOT NULL DEFAULT false,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     is_deleted BOOLEAN NOT NULL DEFAULT false
-- );

-- CREATE TRIGGER update_order_record_modified_at
-- BEFORE UPDATE ON oasis_users
-- FOR EACH ROW
-- EXECUTE FUNCTION update_modified_at();