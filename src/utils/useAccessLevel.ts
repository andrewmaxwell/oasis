import {useSession} from './useSession.ts';

const useAccessLevel = () => {
  const session = useSession();
  return session?.user.user_metadata.access_level as
    | undefined
    | 'readOnly'
    | 'readWrite'
    | 'admin';
};

export const useCanWrite = () => {
  const accessLevel = useAccessLevel();
  return accessLevel === 'admin' || accessLevel === 'readWrite';
};

export const useIsAdmin = () => useAccessLevel() === 'admin';
