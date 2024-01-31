import {Path} from 'react-hook-form';

export type Kid = {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  diaper_size: string;
  is_active: boolean;
  created_at: string;
  modified_at: string;
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
};

export type Deliverer = {
  id: string;
  name: string;
  email: string;
};

export type OrderRecord = {
  id: string;
  date_of_order: string;
  date_of_pickup: string;
  is_completed: boolean;
  created_at: string;
  modified_at: string;
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
};
