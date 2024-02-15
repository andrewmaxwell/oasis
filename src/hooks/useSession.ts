import {Session} from '@supabase/supabase-js';
import {useEffect, useState} from 'react';
import {getSession, onAuthStateChange} from '../supabase.ts';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    getSession().then(({data: {session}}) => setSession(session));
    const sub = onAuthStateChange((_, session) => setSession(session));
    return () => sub.data.subscription.unsubscribe();
  }, []);

  return session;
};
