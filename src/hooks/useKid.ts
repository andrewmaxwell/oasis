import {useEffect, useState} from 'react';
import {DiaperSize, Kid, KidOrderRow} from '../types';
import {useSearchParams} from 'react-router-dom';
import {getKidOrders, getRecord} from '../supabase';

export const useKid = (id?: string) => {
  const [kid, setKid] = useState<Partial<Kid> | undefined>();
  const [kidOrders, setKidOrders] = useState<KidOrderRow[]>();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getRecord('kid', id).then(setKid);
      getKidOrders(id).then(setKidOrders);
    } else {
      Promise.resolve().then(() => {
        setKid({
          is_active: true,
          diaper_size: '' as DiaperSize,
          parent_id: searchParams.get('parent_id') ?? undefined,
          last_name: searchParams.get('last_name') ?? undefined,
        });
      });
    }
  }, [id, searchParams]);

  return {kid, kidOrders};
};
