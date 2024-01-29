CREATE TABLE parent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    phone_number_2 TEXT,
    country_of_origin TEXT NOT NULL,
    rough_family_income NUMERIC,
    -- planned_deliverer TEXT, TODO
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parent(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    diaper_size TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deliverer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL
);

CREATE TABLE order_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_of_order DATE NOT NULL,
    date_of_pickup DATE NOT NULL,
    is_completed BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TODO: Order details. Copy data from parent and kids and deliverer

-- INSERT INTO parent (first_name, last_name, address, city, zip, phone_number, phone_number_2, country_of_origin, rough_family_income, planned_deliverer, is_active)
-- VALUES 
-- ('John', 'Doe', '123 Maple Street', 'Springfield', '12345', '555-1234', NULL, 'USA', 50000, 'Deliverer1', TRUE),
-- ('Jane', 'Smith', '456 Oak Avenue', 'Centerville', '67890', '555-5678', '555-8765', 'Canada', 60000, 'Deliverer2', TRUE),
-- ('Alice', 'Johnson', '789 Pine Road', 'Lakeview', '13579', '555-2468', NULL, 'UK', 55000, 'Deliverer3', FALSE);


-- INSERT INTO kid (parent_id, first_name, last_name, birth_date, diaper_size, is_active)
-- VALUES 
-- ('417b3341-b7a0-4896-95d0-40501b04e087', 'Emily', 'Doe', '2021-06-01', 'Medium', TRUE),
-- ('b5567627-734b-429b-9a38-9d47764c4ac3', 'Michael', 'Smith', '2020-03-15', 'Large', TRUE),
-- ('417b3341-b7a0-4896-95d0-40501b04e087', 'Sophia', 'Doe', '2019-01-20', 'Small', FALSE);