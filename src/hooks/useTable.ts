import {useEffect, useState} from 'react';
import {TableName} from '../types.ts';
import {getAllRecords, subscribe} from '../supabase.ts';

export const useTable = <T extends {id: string}>(tableName: TableName) => {
  const [data, setData] = useState<T[]>();

  useEffect(() => {
    (async () => setData((await getAllRecords(tableName)) as T[]))();

    return subscribe(tableName, ({eventType, old, new: newRecord}) => {
      if (eventType === 'DELETE') {
        setData((data) => data?.filter((row) => row.id !== old.id));
      } else if (eventType === 'INSERT') {
        setData((data) => data && [...data, newRecord as T]);
      } else if (eventType === 'UPDATE') {
        setData((data) =>
          data?.map((row) => (row.id === old.id ? (newRecord as T) : row)),
        );
      }
    });
  }, [tableName]);

  return data;
};
