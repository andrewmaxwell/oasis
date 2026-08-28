import {FormField, OrderRecord} from '../../../types';

/**
 * Adding a field here is not enough on its own: the order is written by the `create_order`
 * Postgres function, which reads `date_of_order`, `date_of_pickup`, and `notes` out of the
 * JSON payload by name and ignores anything else. A fourth field would be collected by the
 * form, sent, and silently dropped. Add the column to the function too (a new migration —
 * see dataModel.sql) and to the mock in e2e/fixtures/supabaseMock.ts.
 */
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
