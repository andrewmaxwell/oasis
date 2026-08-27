import {useQuery} from '@tanstack/react-query';
import {AppUser} from '../types.ts';
import {userManagement} from '../supabase.ts';
import {toAppUser} from '../utils/toAppUser.ts';
import {queryKeys} from '../queryClient.ts';

export const useUserList = (accessToken?: string) => {
  const {data, error, refetch} = useQuery({
    queryKey: queryKeys.users(),
    queryFn: async (): Promise<AppUser[]> => {
      const {users, error: fnError} = await userManagement(
        accessToken as string,
        {action: 'listUsers'},
      );
      // The edge function reports failure as {error} rather than rejecting, so it has to
      // be turned back into a throw for react-query to see it.
      if (fnError) throw new Error(fnError);
      return (users ?? []).map(toAppUser);
    },
    enabled: !!accessToken,
  });

  return {userList: data, error, refetch};
};
