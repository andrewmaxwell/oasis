import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {combineQueries} from './combineQueries.ts';
import {useSearchParams} from 'react-router-dom';
import {DiaperSize, Kid} from '../types';
import {getKidOrders, getRecord} from '../supabase';
import {queryKeys} from '../queryClient';

export const useKid = (id?: string) => {
  const isNew = !id || id === 'new';
  const [searchParams] = useSearchParams();

  const kidQuery = useQuery({
    queryKey: queryKeys.record('kid', id ?? ''),
    queryFn: () => getRecord('kid', id as string),
    enabled: !isNew,
  });

  const ordersQuery = useQuery({
    queryKey: queryKeys.kidOrders(id ?? ''),
    queryFn: () => getKidOrders(id as string),
    enabled: !isNew,
  });

  // A new kid can be pre-filled from the parent page's "Add Kid" link. Memoized because
  // OasisForm passes this straight to react-hook-form's `values`.
  const parentId = searchParams.get('parent_id');
  const lastName = searchParams.get('last_name');
  const blankKid = useMemo(
    () =>
      ({
        is_active: true,
        diaper_size: '' as DiaperSize,
        parent_id: parentId ?? undefined,
        last_name: lastName ?? undefined,
      }) as Partial<Kid>,
    [parentId, lastName],
  );

  return {
    kid: isNew ? blankKid : (kidQuery.data as Partial<Kid> | undefined),
    kidOrders: ordersQuery.data,
    ...combineQueries(kidQuery, ordersQuery),
  };
};
