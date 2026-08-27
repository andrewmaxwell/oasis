import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AppUser} from '../types.ts';
import {userManagement} from '../supabase.ts';
import {toAppUser} from '../utils/toAppUser.ts';
import {queryKeys} from '../queryClient.ts';

export const useUser = (id?: string, accessToken?: string) => {
  const isNew = !id || id === 'new';

  const {data, error, refetch} = useQuery({
    queryKey: queryKeys.user(id ?? ''),
    queryFn: async (): Promise<Partial<AppUser>> => {
      const {user, error: fnError} = await userManagement(
        accessToken as string,
        {action: 'getUserById', args: [id]},
      );
      if (fnError) throw new Error(fnError);
      if (!user) throw new Error(`No user found with id ${id}`);
      return toAppUser(user);
    },
    enabled: !isNew && !!accessToken,
  });

  const blankUser = useMemo(() => ({access_level: ''}) as Partial<AppUser>, []);

  return {user: isNew ? blankUser : data, error, refetch};
};
