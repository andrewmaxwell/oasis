import {useEffect, useState} from 'react';
import {Deliverer, Parent} from '../types';
import {getDelivererParents, getRecord} from '../supabase';

export const useDelivererWithParents = (id?: string) => {
  const [deliverer, setDeliverer] = useState<Partial<Deliverer> | undefined>();
  const [delivererParents, setDelivererParents] = useState<
    Parent[] | undefined
  >();

  useEffect(() => {
    if (id && id !== 'new') {
      getRecord('deliverer', id).then(setDeliverer);
      getDelivererParents(id).then(setDelivererParents);
    } else {
      setDeliverer({is_active: true});
    }
  }, [id]);

  return {deliverer, delivererParents};
};
