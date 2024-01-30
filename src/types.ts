export type Parent = {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  zip: string;
  phone_number: string;
  country_of_origin: string;
  rough_family_income?: number;
  is_active: boolean;
  created_at: Date;
  modified_at: Date;
};

export type Kid = {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  birth_date: Date;
  diaper_size: string;
  is_active: boolean;
  created_at: Date;
  modified_at: Date;
};

export type Deliverer = {
  id: string;
  name: string;
  email: string;
};

export type OrderRecord = {
  id: string;
  date_of_order: Date;
  date_of_pickup: Date;
  is_completed: boolean;
  created_at: Date;
  modified_at: Date;
};
