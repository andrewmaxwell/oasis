import {getAllRecords} from '../supabase.ts';
import memoize from 'memoizee';

export const getDelivererOptions = memoize(
  async () =>
    (await getAllRecords('deliverer'))!
      .map((d) => ({
        value: d.id,
        label: d.name + (d.is_active ? '' : ` (INACTIVE)`),
      }))
      .sort(
        (a, b) =>
          Number(a.label === 'Unassigned') - Number(b.label === 'Unassigned') ||
          a.label.localeCompare(b.label),
      ),
  {promise: true, maxAge: 30000},
);
