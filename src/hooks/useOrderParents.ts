import {useEffect, useState} from 'react';
import {OrderParentViewRow} from '../types';
import {getOrderParents} from '../supabase';

export const useOrderParents = (orderId?: string) => {
  const [orderParents, setOrderParents] = useState<OrderParentViewRow[]>();

  useEffect(() => {
    if (orderId) getOrderParents(orderId).then(setOrderParents);
  }, [orderId]);

  return orderParents;
};
