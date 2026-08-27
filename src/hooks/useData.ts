import {useQuery} from '@tanstack/react-query';

/**
 * The list-fetching hook behind every table page. The getter must be a module-level
 * constant (same rule as `useOptions`) and the key must identify what it returns, so a
 * mutation elsewhere can invalidate it — see `queryKeys` in src/queryClient.ts.
 */
export const useData = <T>(
  queryKey: readonly unknown[],
  getter: () => Promise<T[]>,
) => useQuery({queryKey, queryFn: getter});
