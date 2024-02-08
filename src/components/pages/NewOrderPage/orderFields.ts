import {FormField, OrderRecord} from '../../../types';

export const orderFields: FormField<OrderRecord>[] = [
  {
    id: 'date_of_order',
    label: 'Date of Order',
    required: true,
    type: 'date',
    width: 6,
  },
  {
    id: 'date_of_pickup',
    label: 'Date of Pickup',
    required: true,
    type: 'date',
    width: 6,
  },
  {id: 'notes', label: 'Notes', width: 12, multiline: true},
];
