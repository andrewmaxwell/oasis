import {useEffect, useState} from 'react';
import {TableWithSoftDelete} from '../supabase.ts'; // Need to export this
import {getAllRecords, subscribe} from '../supabase.ts';

export const useTable = <T extends {id: string}>(
  tableName: TableWithSoftDelete,
) => {
  const [data, setData] = useState<T[]>();

  useEffect(() => {
    (async () => setData((await getAllRecords(tableName)) as unknown as T[]))();

    return subscribe(tableName, ({eventType, old, new: newRecord}) => {
      if (eventType === 'DELETE') {
        setData((data) => data?.filter((row) => row.id !== old.id));
      } else if (eventType === 'INSERT') {
        setData((data) => data && [...data, newRecord as T]);
      } else if (eventType === 'UPDATE') {
        // A soft delete reaches us as an UPDATE setting is_deleted, not as a DELETE, so
        // the row has to be dropped here or it stays in the list (and stays eligible to be
        // snapshotted into a new order).
        setData((data) =>
          (newRecord as {is_deleted?: boolean}).is_deleted
            ? data?.filter((row) => row.id !== old.id)
            : data?.map((row) => (row.id === old.id ? (newRecord as T) : row)),
        );
      }
    });
  }, [tableName]);

  return data;
};
