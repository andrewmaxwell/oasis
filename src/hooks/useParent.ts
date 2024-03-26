import {useEffect, useState} from 'react';
import {getKidsForParent, getParentOrders, getRecord} from '../supabase';
import {Parent, ParentOrderRow} from '../types';

const getParent = async (parentId: string) => {
  const [parent, kid] = await Promise.all([
    getRecord('parent', parentId) as Promise<Parent>,
    getKidsForParent(parentId),
  ]);

  parent.kid = kid.toSorted((a, b) =>
    (b.birth_date ?? '').localeCompare(a.birth_date ?? ''),
  );
  parent.deliverer_id = parent.deliverer_id || '';
  return parent;
};

export const useParent = (id?: string) => {
  const [parent, setParent] = useState<Partial<Parent> | undefined>();
  const [parentOrders, setParentOrders] = useState<ParentOrderRow[]>();

  useEffect(() => {
    if (id && id !== 'new') {
      getParent(id).then(setParent);
      getParentOrders(id).then(setParentOrders);
    } else {
      setParent({is_active: true, deliverer_id: ''});
    }
  }, [id]);

  return {parent, parentOrders};
};
