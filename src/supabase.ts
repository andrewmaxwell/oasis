/* eslint-disable import/named */
import {
  AuthChangeEvent,
  RealtimePostgresChangesPayload,
  Session,
  createClient,
} from '@supabase/supabase-js';
import {Deliverer, OrderKid, Parent, TableName} from './types.ts';

const supabase = createClient(
  'https://lsagjnicdssonuenzunb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWdqbmljZHNzb251ZW56dW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY0NzUyNTcsImV4cCI6MjAyMjA1MTI1N30.1VkzEeHTTL7YChYnv4oGnEY811yRU2hnOD8YffCXuh8',
);

const log = (error: {message: string}) => {
  console.error(error);
  alert(error.message);
};

export const signIn = async (email: string, password: string) => {
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) log(error);
};

export const updatePassword = async (password: string) => {
  const {error} = await supabase.auth.updateUser({password});
  if (error) log(error);
};

export const logOut = () => supabase.auth.signOut();

export const getParentsAndKids = async () => {
  const {data, error} = await supabase
    .from('parent')
    .select('*, kid (id)')
    .eq('is_deleted', false);
  if (error) log(error);
  return data as Parent[];
};

export const getSession = () => supabase.auth.getSession();

export const onAuthStateChange = (
  func: (event: AuthChangeEvent, session: Session | null) => void,
) => supabase.auth.onAuthStateChange(func);

export const getParent = async (parentId: string) => {
  const {data, error} = await supabase
    .from('parent')
    .select('*, kid (*)')
    .eq('id', parentId)
    .eq('is_deleted', false);
  if (error) log(error);
  return data?.[0] as Parent;
};

export const getAllRecords = async (tableName: TableName) => {
  const {data, error} = await supabase
    .from(tableName)
    .select()
    .eq('is_deleted', false);
  if (error) log(error);
  return data;
};

export const getRecord = async (tableName: TableName, id: string) => {
  const {data, error} = await supabase
    .from(tableName)
    .select()
    .eq('id', id)
    .eq('is_deleted', false);
  if (error) log(error);
  return data?.[0];
};

export const insertRecord = async (tableName: TableName, newRecord: object) => {
  const {data, error} = await supabase
    .from(tableName)
    .insert(newRecord)
    .select();
  if (error) log(error);
  return data?.[0];
};

export const updateRecord = async (
  tableName: TableName,
  id: string,
  updates: object,
) => {
  const {error} = await supabase.from(tableName).update(updates).eq('id', id);
  if (error) log(error);
};

export const deleteRecord = async (tableName: TableName, id: string) => {
  // const {error} = await supabase.from(tableName).delete().eq('id', id);

  // soft delete!
  const {error} = await supabase
    .from(tableName)
    .update({is_deleted: true})
    .eq('id', id);
  if (error) log(error);
};

export const subscribe = (
  tableName: TableName,
  onChange: (
    payload: RealtimePostgresChangesPayload<{[key: string]: any}>,
  ) => void,
) => {
  const channel = supabase
    .channel(tableName)
    .on(
      'postgres_changes',
      {event: '*', schema: 'public', table: tableName},
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getOrderParents = async (orderId: string) => {
  const {data, error} = await supabase
    .from('order_parent')
    .select('deliverer (*), parent (*)')
    .eq('order_id', orderId);
  if (error) log(error);
  return data as unknown as {deliverer: Deliverer; parent: Parent}[];
};

export const getOrderKids = async (orderId: string) => {
  const {data, error} = await supabase
    .from('order_kid')
    .select('kid (parent_id), diaper_size, diaper_quantity')
    .eq('order_id', orderId);
  if (error) log(error);

  return data as unknown as OrderKid[];
};
