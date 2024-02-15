import {useEffect, useState} from 'react';
import {AppUser} from '../types';
import {userManagement} from '../supabase';

export const useUserList = (accessToken?: string) => {
  const [userList, setUserList] = useState<AppUser[]>();

  useEffect(() => {
    if (!accessToken) return;
    userManagement(accessToken, {action: 'listUsers'}).then(({users}) =>
      setUserList(users.map((u: any) => ({...u, ...u.user_metadata}))),
    );
  }, [accessToken]);

  return userList;
};
