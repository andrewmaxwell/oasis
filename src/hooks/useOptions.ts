import {useEffect, useState} from 'react';
import {Option} from '../types.ts';

export const useOptions = (
  optsOrGetOpts: Option[] | (() => Promise<Option[]>),
) => {
  const [options, setOptions] = useState<Option[]>();

  useEffect(() => {
    if (Array.isArray(optsOrGetOpts)) {
      setOptions(optsOrGetOpts);
    } else {
      optsOrGetOpts().then(setOptions);
    }
  }, [optsOrGetOpts]);

  return options;
};
