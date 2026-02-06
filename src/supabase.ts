import {
  AuthChangeEvent,
  RealtimePostgresChangesPayload,
  Session,
  createClient,
} from '@supabase/supabase-js';
import {
  Database,
  Kid,
  KidOrderRow,
  OrderParentViewRow,
  ParentOrderRow,
  TableName,
} from './types.ts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type TableWithId = 'parent' | 'kid' | 'deliverer' | 'order_record';
export type TableWithSoftDelete =
  | 'parent'
  | 'kid'
  | 'deliverer'
  | 'order_record'
  | 'order_kid';

// Helper to bypass strict union checks in generic functions

const from = (table: string) => supabase.from(table) as any;

const log = (error: {message: string}) => {
  console.error(error);
  alert(error.message);
  throw error;
};

export const signIn = async (email: string, password: string) => {
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) log(error);
};

export const updatePassword = async (password: string) => {
  const {error} = await supabase.auth.updateUser({password});
  if (error) log(error);
  return !error;
};

export const logOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const onAuthStateChange = (
  func: (event: AuthChangeEvent, session: Session | null) => void,
) => supabase.auth.onAuthStateChange(func);

export const getKidsForParent = async (parentId: string) => {
  const {data, error} = await supabase
    .from('kid')
    .select()
    .eq('parent_id', parentId)
    .eq('is_deleted', false);
  if (error) log(error);
  return data as Kid[];
};

export const getAllRecords = async <T extends TableWithSoftDelete>(
  tableName: T,
) => {
  const {data, error} = await from(tableName).select().eq('is_deleted', false);
  if (error) log(error);
  return data as Database['public']['Tables'][T]['Row'][];
};

export const getTableCount = async (tableName: TableWithSoftDelete) => {
  const {count, error} = await from(tableName)
    .select('*', {count: 'exact', head: true})
    .eq('is_deleted', false);
  if (error) log(error);
  return count || 0;
};

export const getView = async (viewName: string) => {
  const {data, error} = await supabase.from(viewName).select();
  if (error) log(error);
  return data;
};

export const getRecord = async <T extends TableWithId>(
  tableName: T,
  id: string,
) => {
  const {data, error} = await from(tableName)
    .select()
    .eq('id', id)
    .eq('is_deleted', false);
  if (error) log(error);
  return data?.[0] as Database['public']['Tables'][T]['Row'] | undefined;
};

export const insertRecord = async <T extends TableName>(
  tableName: T,
  newRecord:
    | Database['public']['Tables'][T]['Insert']
    | Database['public']['Tables'][T]['Insert'][],
) => {
  const {data, error} = await from(tableName).insert(newRecord).select();
  if (error) log(error);
  return data?.[0] as Database['public']['Tables'][T]['Row'] | undefined;
};

export const updateRecord = async <T extends TableWithId>(
  tableName: T,
  id: string,
  updates: Database['public']['Tables'][T]['Update'],
) => {
  const {error} = await from(tableName).update(updates).eq('id', id);
  if (error) log(error);
  else return true;
};

export const softDelete = async (
  tableName: TableWithSoftDelete,
  id: string,
) => {
  const {error} = await from(tableName).update({is_deleted: true}).eq('id', id);
  if (error) log(error);
};

export const hardDelete = async (tableName: TableWithId, id: string) => {
  const {error} = await from(tableName).delete().eq('id', id);
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
    .from('finished_order_view')
    .select()
    .eq('order_id', orderId);
  if (error) log(error);
  return data as unknown as OrderParentViewRow[];
};

export const getKidOrders = async (kidId: string) => {
  const {data, error} = await supabase
    .from('kid_order_view')
    .select()
    .eq('kid_id', kidId);
  if (error) log(error);
  return data as KidOrderRow[];
};

export const getParentOrders = async (parentId: string) => {
  const {data, error} = await supabase
    .from('parent_order_view')
    .select()
    .eq('parent_id', parentId);
  if (error) log(error);
  return data as unknown as ParentOrderRow[];
};

export const getDelivererParents = async (delivererId: string) => {
  const {data, error} = await supabase
    .from('parent')
    .select()
    .eq('is_deleted', false)
    .eq('is_active', true)
    .eq('deliverer_id', delivererId);
  if (error) log(error);
  return data ?? [];
};

export const userManagement = async (token: string, payload: object) => {
  const response = await fetch(supabaseUrl + '/functions/v1/user-management', {
    method: 'post',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload),
  });
  return await response.json();
};
