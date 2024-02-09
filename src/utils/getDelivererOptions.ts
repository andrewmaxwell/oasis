import {getView} from '../supabase.ts';
import memoize from 'memoizee';
import {Option} from '../types.ts';

export const getDelivererOptions = memoize(
  async () => (await getView('deliverer_options')) as Option[],
  {promise: true, maxAge: 30000},
);
