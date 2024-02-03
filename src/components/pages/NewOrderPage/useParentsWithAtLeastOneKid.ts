import {useMemo} from 'react';
import {Kid, Parent} from '../../../types.ts';
import {useTable} from '../../../utils/useTable.ts';
import {groupBy} from '../../../utils/groupBy.ts';

export const useParentsWithAtLeastOneKid = () => {
  const parents = useTable<Parent>('parent');
  const kids = useTable<Kid>('kid');

  return useMemo(() => {
    const kidIndex = groupBy(kids || [], (k) => k.parent_id);
    return parents
      ?.filter((p) => kidIndex[p.id])
      .map((p) => ({...p, kid: kidIndex[p.id]}));
  }, [parents, kids]);
};
