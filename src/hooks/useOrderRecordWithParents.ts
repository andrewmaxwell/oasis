import {useEffect, useMemo, useState} from 'react';
import {OrderParent, OrderRecord} from '../types';
import {getOrderParents, getRecord} from '../supabase';

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

  return {orderRecord, orderParents, sortedByDeliverer};
};
