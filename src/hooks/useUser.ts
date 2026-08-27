import {useEffect, useState} from 'react';
import {AppUser} from '../types.ts';
import {userManagement} from '../supabase.ts';
import {toAppUser} from '../utils/toAppUser.ts';

export const useUser = (id?: string, accessToken?: string) => {
  const [user, setUser] = useState<Partial<AppUser>>();

  useEffect(() => {
    if (!accessToken) return;
    if (id && id !== 'new') {
      userManagement(accessToken, {
        action: 'getUserById',
        args: [id],
      }).then(({user}) => setUser(user ? toAppUser(user) : undefined));
    } else {
      Promise.resolve().then(() => setUser({access_level: ''}));
    }
  }, [id, accessToken]);

  return user;
};
