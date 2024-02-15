import {useEffect, useState} from 'react';
import {AppUser} from '../types';
import {userManagement} from '../supabase';

export const useUser = (id?: string, accessToken?: string) => {
  const [user, setUser] = useState<Partial<AppUser>>();

  useEffect(() => {
    if (!accessToken) return;
    if (id && id !== 'new') {
      userManagement(accessToken, {
        action: 'getUserById',
        args: [id],
      }).then(({user}) =>
        setUser({
          id: user.id,
          email: user.email,
          access_level: '',
          ...user.user_metadata,
        }),
      );
    } else {
      setUser({access_level: ''});
    }
  }, [id, accessToken]);

  return user;
};
