import {Path} from 'react-hook-form';

export const DIAPER_SIZES = [
  'P',
  'N',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
] as const;

export type DiaperSize = (typeof DIAPER_SIZES)[number];

export type Kid = {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  gender: 'M' | 'F';
  birth_date?: string | null;
  diaper_size: DiaperSize;
  is_active: boolean;
  created_at: string;
  modified_at: string;
  notes?: string;
};

export type Deliverer = {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
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
  phone_number?: string;
  country_of_origin: string;
  rough_family_income?: number | null;
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

export type TableName = keyof Database['public']['Tables'];

// Table definitions (Strictly matches DB)
export type OrderKid = {
  order_id: string; // Foreign keys are part of the row
  kid_id: string;
  diaper_size: DiaperSize;
  diaper_quantity: number;
  is_deleted: boolean;
};

export type OrderParent = {
  order_id: string;
  parent_id: string;
  deliverer_id: string;
};

// View Definitions (Includes joined data)
export type OrderKidViewRow = {
  diaper_size: DiaperSize;
  diaper_quantity: number;
  kid: {parent_id: string};
};

export type OrderParentViewRow = {
  parent_id: string;
  parent_name: string;
  address: string;
  city: string;
  zip: string;
  phone_number?: string;
  deliverer_id: string;
  deliverer_name?: string;
  deliverer_email: string;
  order_kids: {
    kid_id: string;
    diaper_size: DiaperSize;
    diaper_quantity: number;
  }[];
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  access_level: string;
  notes: string;
};

export type KidOrderRow = {
  id: string;
  date_of_order: string;
  diaper_size: DiaperSize;
  diaper_quantity: string;
  order_notes: string | null;
};

export type ParentOrderRow = {
  id: string;
  date_of_order: string;
  order_notes: string | null;
  deliverer_id: string;
  deliverer_name: string;
  order_kids: {
    kid_id: string;
    diaper_size: DiaperSize;
    diaper_quantity: number;
  }[];
};

export type Database = {
  public: {
    Tables: {
      parent: {
        Row: Parent;
        Insert: Omit<Parent, 'id' | 'created_at' | 'modified_at'>;
        Update: Partial<Omit<Parent, 'id' | 'created_at' | 'modified_at'>>;
      };
      kid: {
        Row: Kid;
        Insert: Omit<Kid, 'id' | 'created_at' | 'modified_at'>;
        Update: Partial<Omit<Kid, 'id' | 'created_at' | 'modified_at'>>;
      };
      deliverer: {
        Row: Deliverer;
        Insert: Omit<Deliverer, 'id' | 'created_at' | 'modified_at'>;
        Update: Partial<Omit<Deliverer, 'id' | 'created_at' | 'modified_at'>>;
      };
      order_record: {
        Row: OrderRecord;
        Insert: Omit<OrderRecord, 'id' | 'created_at' | 'modified_at'>;
        Update: Partial<Omit<OrderRecord, 'id' | 'created_at' | 'modified_at'>>;
      };
      order_parent: {
        Row: OrderParent;
        Insert: OrderParent;
        Update: Partial<OrderParent>;
      };
      order_kid: {
        Row: OrderKid;
        Insert: Omit<OrderKid, 'is_deleted'>;
        Update: Partial<OrderKid>;
      };
    };
    Views: {
      finished_order_view: {
        Row: OrderParentViewRow;
      };
      kid_order_view: {
        Row: KidOrderRow;
      };
      parent_order_view: {
        Row: ParentOrderRow;
      };
      parent_view: {
        Row: Parent & {deliverer_name: string; diaper_sizes: string[]}; // Approximate
      };
    };
  };
};
