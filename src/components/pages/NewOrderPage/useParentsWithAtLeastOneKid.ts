import {useMemo} from 'react';
import {Kid, Parent} from '../../../types.ts';
import {useTable} from '../../../hooks/useTable.ts';
import {groupBy} from '../../../utils/groupBy.ts';
import {combineQueries} from '../../../hooks/combineQueries.ts';

export const useParentsWithAtLeastOneKid = () => {
  const parentsQuery = useTable<Parent>('parent');
  const kidsQuery = useTable<Kid>('kid');

  const {data: parents} = parentsQuery;
  const {data: kids} = kidsQuery;

  const withKids = useMemo(() => {
    const kidIndex = groupBy(kids || [], (k) => k.parent_id);
    return parents
      ?.filter((p) => kidIndex[p.id])
      .map((p) => ({...p, kid: kidIndex[p.id]}));
  }, [parents, kids]);

  return {parents: withKids, ...combineQueries(parentsQuery, kidsQuery)};
};
