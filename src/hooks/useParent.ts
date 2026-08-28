import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {combineQueries} from './combineQueries.ts';
import {getKidsForParent, getParentOrders, getRecord} from '../supabase';
import {Parent} from '../types';
import {queryKeys} from '../queryClient';

const getParent = async (parentId: string) => {
  const [parent, kids] = await Promise.all([
    getRecord('parent', parentId) as Promise<Parent>,
    getKidsForParent(parentId),
  ]);

  parent.kid = kids.sort((a, b) =>
    (b.birth_date ?? '').localeCompare(a.birth_date ?? ''),
  );
  return parent;
};

export const useParent = (id?: string) => {
  const isNew = !id || id === 'new';

  const parentQuery = useQuery({
    queryKey: queryKeys.record('parent', id ?? ''),
    queryFn: () => getParent(id as string),
    enabled: !isNew,
  });

  const ordersQuery = useQuery({
    queryKey: queryKeys.parentOrders(id ?? ''),
    queryFn: () => getParentOrders(id as string),
    enabled: !isNew,
  });

  // Stable identity: OasisForm feeds this to react-hook-form's `values`, which resets the
  // form every time the reference changes.
  const blankParent = useMemo(
    () => ({is_active: true, deliverer_id: ''}) as Partial<Parent>,
    [],
  );

  return {
    parent: isNew ? blankParent : parentQuery.data,
    parentOrders: ordersQuery.data,
    ...combineQueries(parentQuery, ordersQuery),
  };
};
