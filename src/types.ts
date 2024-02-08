import {Path} from 'react-hook-form';

export type Kid = {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  gender: 'M' | 'F';
  birth_date: string;
  diaper_size: string;
  is_active: boolean;
  created_at: string;
  modified_at: string;
  notes?: string;
};

export type Deliverer = {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  modified_at: string;
  notes?: string;
};

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
  created_at: string;
  modified_at: string;
  kid: Kid[];
  deliverer_id: string;
  notes?: string;
};

export type OrderRecord = {
  id: string;
  date_of_order: string;
  date_of_pickup: string;
  created_at: string;
  modified_at: string;
  notes?: string;
};

export type Option = {
  label: string;
  value: string;
};
export type FormField<T> = {
  id: Path<Partial<T>>;
  label: string;
  required?: boolean;
  width?: number;
  type?: 'text' | 'number' | 'switch' | 'select' | 'date';
  options?: Option[] | (() => Promise<Option[]>);
  multiline?: boolean;
};

export type TableName =
  | 'parent'
  | 'kid'
  | 'deliverer'
  | 'order_record'
  | 'order_parent'
  | 'order_kid';

export type OrderKid = {
  diaper_size: string;
  diaper_quantity: number;
  kid: {parent_id: string};
};

export type OrderParent = {
  parent_id: string;
  parent_name: string;
  address: string;
  city: string;
  zip: string;
  phone_number: string;
  deliverer_id: string;
  deliverer_name: string;
  deliverer_email: string;
  order_kids: {kid_id: string; diaper_size: string; diaper_quantity: number}[];
};
