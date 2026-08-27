import {useEffect, useState} from 'react';
import {AppUser} from '../types.ts';
import {userManagement} from '../supabase.ts';
import {toAppUser} from '../utils/toAppUser.ts';

export const useUserList = (accessToken?: string) => {
  const [userList, setUserList] = useState<AppUser[]>();

  useEffect(() => {
    if (!accessToken) return;
    userManagement(accessToken, {action: 'listUsers'}).then(({users}) =>
      setUserList((users ?? []).map(toAppUser)),
    );
  }, [accessToken]);

  return userList;
};
