import {AccessLevel} from '../types.ts';
import {useSessionState} from './useSession.ts';

/**
 * Read from `app_metadata`, NOT `user_metadata`: users can write their own
 * `user_metadata` via `supabase.auth.updateUser({data})`, so a level stored there
 * could be self-granted. `app_metadata` is writable only with the service role key.
 *
 * These hooks drive UI affordances. The real enforcement is the RLS policies (see
 * scripts/generateTriggersAndPolicies.js) and the user-management edge function.
 */
export const useAccessLevel = () => {
  const {session, loaded} = useSessionState();
  return {
    accessLevel: session?.user.app_metadata?.access_level as
      | AccessLevel
      | undefined,
    loaded,
  };
};

export const useCanWrite = () => {
  const {accessLevel} = useAccessLevel();
  return accessLevel === 'admin' || accessLevel === 'readWrite';
};

export const useIsAdmin = () => useAccessLevel().accessLevel === 'admin';
