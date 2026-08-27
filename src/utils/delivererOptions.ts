import {getView} from '../supabase.ts';
import {Option, OptionSource} from '../types.ts';

/**
 * Deliverer choices for the parent form. Fetching is cached by react-query under this
 * key rather than by a 30-second memoize, so adding a deliverer can invalidate it and the
 * dropdown is correct immediately.
 */
export const delivererOptions: OptionSource = {
  key: 'deliverer_options',
  load: async () => (await getView('deliverer_options')) as Option[],
};
