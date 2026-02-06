import {useEffect, useState} from 'react';
import {Option} from '../types.ts';

export const useOptions = (
  optsOrGetOpts: Option[] | (() => Promise<Option[]>),
) => {
  const [asyncOptions, setAsyncOptions] = useState<Option[]>();

  useEffect(() => {
    if (!Array.isArray(optsOrGetOpts)) {
      optsOrGetOpts().then(setAsyncOptions);
    }
  }, [optsOrGetOpts]);

  return Array.isArray(optsOrGetOpts) ? optsOrGetOpts : asyncOptions;
};
