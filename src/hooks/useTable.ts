import {useEffect} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getAllRecords, subscribe, TableWithSoftDelete} from '../supabase.ts';
import {queryKeys} from '../queryClient.ts';

/**
 * A table plus a live Postgres subscription that patches the cached rows in place. Used by
 * the new-order flow, where a stale roster would be snapshotted into a real order.
 */
export const useTable = <T extends {id: string}>(
  tableName: TableWithSoftDelete,
) => {
  const queryClient = useQueryClient();

  const {data, error, refetch} = useQuery({
    queryKey: queryKeys.table(tableName),
    queryFn: async () => (await getAllRecords(tableName)) as unknown as T[],
  });

  useEffect(
    () =>
      subscribe(tableName, ({eventType, old, new: newRecord}) => {
        const queryKey = queryKeys.table(tableName);
        queryClient.setQueryData<T[]>(queryKey, (rows) => {
          if (!rows) return rows;
          if (eventType === 'DELETE') {
            return rows.filter((row) => row.id !== old.id);
          }
          if (eventType === 'INSERT') return [...rows, newRecord as T];
          if (eventType === 'UPDATE') {
            // A soft delete arrives as an UPDATE setting is_deleted, not as a DELETE, so
            // the row has to be dropped here or it stays in the list (and stays eligible
            // to be snapshotted into a new order).
            return (newRecord as {is_deleted?: boolean}).is_deleted
              ? rows.filter((row) => row.id !== old.id)
              : rows.map((row) => (row.id === old.id ? (newRecord as T) : row));
          }
          return rows;
        });
      }),
    [tableName, queryClient],
  );

  return {data, error, refetch};
};
