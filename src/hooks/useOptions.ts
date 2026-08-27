import {useQuery} from '@tanstack/react-query';
import {Option, OptionSource} from '../types.ts';
import {queryKeys} from '../queryClient.ts';

/**
 * Select options are either a literal list or a named async source. The name is the cache
 * key, which is what lets a newly added deliverer be invalidated into the dropdown instead
 * of waiting out a memoized TTL.
 */
export const useOptions = (options: Option[] | OptionSource) => {
  const isStatic = Array.isArray(options);

  const {data} = useQuery({
    queryKey: queryKeys.options(isStatic ? 'static' : options.key),
    // Never runs when the options are a literal list, but keep it total rather than
    // casting — `enabled` is the only thing standing between this and a crash.
    queryFn: () => (isStatic ? [] : options.load()),
    enabled: !isStatic,
  });

  return isStatic ? options : data;
};
