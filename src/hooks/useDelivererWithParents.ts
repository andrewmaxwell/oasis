import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {combineQueries} from './combineQueries.ts';
import {Deliverer} from '../types';
import {getDelivererParents, getRecord} from '../supabase';
import {queryKeys} from '../queryClient';

export const useDelivererWithParents = (id?: string) => {
  const isNew = !id || id === 'new';

  const delivererQuery = useQuery({
    queryKey: queryKeys.record('deliverer', id ?? ''),
    queryFn: () => getRecord('deliverer', id as string),
    enabled: !isNew,
  });

  const parentsQuery = useQuery({
    queryKey: queryKeys.delivererParents(id ?? ''),
    queryFn: () => getDelivererParents(id as string),
    enabled: !isNew,
  });

  const blankDeliverer = useMemo(
    () => ({is_active: true}) as Partial<Deliverer>,
    [],
  );

  return {
    deliverer: isNew
      ? blankDeliverer
      : (delivererQuery.data as Partial<Deliverer> | undefined),
    delivererParents: parentsQuery.data,
    ...combineQueries(delivererQuery, parentsQuery),
  };
};
