// eslint-disable-next-line import/named
import {AuthChangeEvent, Session, createClient} from '@supabase/supabase-js';
import {Parent} from './types.ts';

const supabase = createClient(
  'https://lsagjnicdssonuenzunb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWdqbmljZHNzb251ZW56dW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY0NzUyNTcsImV4cCI6MjAyMjA1MTI1N30.1VkzEeHTTL7YChYnv4oGnEY811yRU2hnOD8YffCXuh8',
);

export const signIn = async (email: string, password: string) => {
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) alert(error.message);
};

export const updatePassword = async (password: string) => {
  const {error} = await supabase.auth.updateUser({password});
  if (error) alert(error.message);
};

export const logOut = () => supabase.auth.signOut();

export const getParentsWithChildren = async () => {
  const {data, error} = await supabase.from('parent').select(`*, kid:id (*)`);
  if (error) alert(error.message);
  return data as Parent[];
};

export const getSession = () => supabase.auth.getSession();

export const onAuthStateChange = (
  func: (event: AuthChangeEvent, session: Session | null) => void,
) => supabase.auth.onAuthStateChange(func);

export const getParent = async (parentId: string) => {
  const {data, error} = await supabase
    .from('parent')
    .select(`*, kid (*)`)
    .eq('id', parentId);
  if (error) alert(error.message);
  return data?.[0] as Parent;
};

export const getAllRecords = async (tableName: string) => {
  const {data, error} = await supabase.from(tableName).select();
  if (error) alert(error.message);
  return data;
};

export const getRecord = async (tableName: string, id: string) => {
  const {data, error} = await supabase.from(tableName).select().eq('id', id);
  if (error) alert(error.message);
  return data?.[0];
};

export const insertRecord = async (tableName: string, newRecord: object) => {
  const {data, error} = await supabase
    .from(tableName)
    .insert(newRecord)
    .select();
  if (error) alert(error.message);
  return data?.[0];
};

export const updateRecord = async (
  tableName: string,
  id: string,
  updates: object,
) => {
  const {error} = await supabase.from(tableName).update(updates).eq('id', id);
  if (error) alert(error.message);
};

export const deleteRecord = async (tableName: string, id: string) => {
  const {error} = await supabase.from(tableName).delete().eq('id', id);
  if (error) alert(error.message);
};
