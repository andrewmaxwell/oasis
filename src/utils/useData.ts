import {useEffect, useState} from 'react';

export const useData = <T>(getter: () => Promise<T[]>) => {
  const [data, setData] = useState<T[] | undefined>();

  useEffect(() => {
    getter().then(setData);
  }, [getter]);

  return data;
};
