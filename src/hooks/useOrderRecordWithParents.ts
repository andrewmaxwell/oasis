import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {combineQueries} from './combineQueries.ts';
import {OrderRecord} from '../types';
import {getOrderParents, getRecord} from '../supabase';
import {groupBy} from '../utils/groupBy';
import {queryKeys} from '../queryClient';

export const useOrderRecordWithParents = (orderId?: string) => {
  const recordQuery = useQuery({
    queryKey: queryKeys.record('order_record', orderId ?? ''),
    queryFn: () => getRecord('order_record', orderId as string),
    enabled: !!orderId,
  });

  const parentsQuery = useQuery({
    queryKey: queryKeys.orderParents(orderId ?? ''),
    queryFn: () => getOrderParents(orderId as string),
    enabled: !!orderId,
  });

  const orderParents = parentsQuery.data;

  const sortedByDeliverer = useMemo(
    () =>
      orderParents
        ? [...orderParents].sort((a, b) =>
            String(a.deliverer_name).localeCompare(String(b.deliverer_name)),
          )
        : undefined,
    [orderParents],
  );

  const groupedByZip = useMemo(() => {
    if (!orderParents) return undefined;

    return Object.entries(groupBy(orderParents, (p) => p.zip))
      .map(([zip, parents]) => ({
        zip,
        order_kids: parents.flatMap((p) => p.order_kids),
        parents: parents.length,
        kids: parents
          .map((p) => p.order_kids.length)
          .reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => a.zip.localeCompare(b.zip));
  }, [orderParents]);

  return {
    orderRecord: recordQuery.data as OrderRecord | undefined,
    orderParents,
    sortedByDeliverer,
    groupedByZip,
    ...combineQueries(recordQuery, parentsQuery),
  };
};
