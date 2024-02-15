import {useEffect, useState} from 'react';
import {OrderParent} from '../types';
import {getOrderParents} from '../supabase';

export const useOrderParents = (orderId?: string) => {
  const [orderParents, setOrderParents] = useState<OrderParent[]>();

  useEffect(() => {
    if (orderId) getOrderParents(orderId).then(setOrderParents);
  }, [orderId]);

  return orderParents;
};
