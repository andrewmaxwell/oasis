import {useEffect, useMemo, useState} from 'react';
import {OrderParent, OrderRecord} from '../types';
import {getOrderParents, getRecord} from '../supabase';
import {groupBy} from '../utils/groupBy';

export const useOrderRecordWithParents = (orderId?: string) => {
  const [orderRecord, setOrderRecord] = useState<OrderRecord>();
  const [orderParents, setOrderParents] = useState<OrderParent[]>();

  useEffect(() => {
    if (orderId) {
      getRecord('order_record', orderId).then(setOrderRecord);
      getOrderParents(orderId).then(setOrderParents);
    }
  }, [orderId]);

  const sortedByDeliverer = useMemo(
    () =>
      orderParents?.toSorted((a, b) =>
        a.deliverer_name.localeCompare(b.deliverer_name),
      ),
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

  return {orderRecord, orderParents, sortedByDeliverer, groupedByZip};
};
