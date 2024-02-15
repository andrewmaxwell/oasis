import {useEffect, useState} from 'react';
import {Kid} from '../types';
import {useSearchParams} from 'react-router-dom';
import {getRecord} from '../supabase';

export const useKid = (id?: string) => {
  const [kid, setKid] = useState<Partial<Kid> | undefined>();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getRecord('kid', id).then(setKid);
    } else {
      setKid({
        is_active: true,
        diaper_size: '',
        parent_id: searchParams.get('parent_id') ?? undefined,
        last_name: searchParams.get('last_name') ?? undefined,
      });
    }
  }, [id, searchParams]);

  return kid;
};
