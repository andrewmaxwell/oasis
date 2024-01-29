import {Session, createClient} from '@supabase/supabase-js';
import {useEffect, useState} from 'react';
const supabase = createClient(
  'https://lsagjnicdssonuenzunb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWdqbmljZHNzb251ZW56dW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY0NzUyNTcsImV4cCI6MjAyMjA1MTI1N30.1VkzEeHTTL7YChYnv4oGnEY811yRU2hnOD8YffCXuh8',
);

const query = (getter: () => any) => async () => {
  const {data, error} = await getter();
  if (error) {
    console.error(error);
    throw new Error(error);
  }
  console.log('>>>', data);
  return data;
};

export const signIn = async (email: string, password: string) => {
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) alert(error);
};

export const updatePassword = async (password: string) => {
  const {error} = await supabase.auth.updateUser({password});
  if (error) alert(error);
};

export const logOut = () => supabase.auth.signOut();

export const getParentsWithChildren = query(() =>
  supabase.from('parent').select(`*, kid:id (*)`),
);

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({data: {session}}) => {
      setSession(session);
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return session;
};
