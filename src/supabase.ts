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

/**
 * Supabase returns from an invite or password-reset link with
 * `#access_token=...&type=invite` in the fragment. Read it BEFORE createClient(), because
 * supabase-js consumes and clears that fragment as soon as the client initializes.
 *
 * This matters because invited accounts are created with no password (see the
 * user-management edge function): if we drop them on the dashboard instead of the password
 * form, they are signed in now but permanently locked out the moment they sign out.
 */
let pendingAuthRedirect = new URLSearchParams(
  window.location.hash.replace(/^#\/?/, ''),
).get('type');

/** True once, if this page load came from an invite or recovery link. */
export const consumePasswordSetupRedirect = () => {
  const needsSetup =
    pendingAuthRedirect === 'invite' || pendingAuthRedirect === 'recovery';
  pendingAuthRedirect = null;
  return needsSetup;
};

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type TableWithId = 'parent' | 'kid' | 'deliverer' | 'order_record';
export type TableWithSoftDelete =
  | 'parent'
  | 'kid'
  | 'deliverer'
  | 'order_record'
  | 'order_kid';

/** The subset of the above that carries an `is_active` flag. */
export type TableWithActiveFlag = 'parent' | 'kid' | 'deliverer';

// Helper to bypass strict union checks in generic functions

const from = (table: string) => supabase.from(table) as any;

/**
 * Every query funnels its failure through here. It throws rather than returning, which is
 * what lets react-query see the rejection and drive retries, the inline `<ErrorState>`, and
 * the error toast. It used to also `alert()`, which blocked the thread and left the page on
 * a spinner behind the dialog (ISSUES #9) — the UI layer owns that presentation now.
 */
const fail = (error: {message: string}): never => {
  console.error(error);
  // Supabase's auth errors are already Error instances; its Postgrest errors are plain
  // objects, and react-query's consumers expect something with a stack.
  throw error instanceof Error ? error : new Error(error.message);
};

export const signIn = async (email: string, password: string) => {
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) fail(error);
};

export const updatePassword = async (password: string) => {
  const {error} = await supabase.auth.updateUser({password});
  if (error) fail(error);
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
  if (error) fail(error);
  return (data ?? []) as Kid[];
};

export const getAllRecords = async <T extends TableWithSoftDelete>(
  tableName: T,
) => {
  const {data, error} = await from(tableName).select().eq('is_deleted', false);
  if (error) fail(error);
  return (data ?? []) as Database['public']['Tables'][T]['Row'][];
};

/**
 * Counts live, active rows. Narrowed to the tables that actually have `is_active` — the
 * order tables don't, and this used to be labelled "Active" in the UI while counting
 * inactive records too.
 */
export const getTableCount = async (tableName: TableWithActiveFlag) => {
  const {count, error} = await from(tableName)
    .select('*', {count: 'exact', head: true})
    .eq('is_deleted', false)
    .eq('is_active', true);
  if (error) fail(error);
  return count || 0;
};

export const getView = async (viewName: string) => {
  const {data, error} = await supabase.from(viewName).select();
  if (error) fail(error);
  return data ?? [];
};

export const getRecord = async <T extends TableWithId>(
  tableName: T,
  id: string,
) => {
  const {data, error} = await from(tableName)
    .select()
    .eq('id', id)
    .eq('is_deleted', false);
  if (error) fail(error);
  // A missing id used to return undefined, which every caller rendered as a spinner that
  // never resolved. Throwing lets the page show "not found" and offer a way back.
  if (!data?.length) throw new Error(`No ${tableName} found with id ${id}`);
  return data[0] as Database['public']['Tables'][T]['Row'];
};

export const insertRecord = async <T extends TableName>(
  tableName: T,
  newRecord:
    | Database['public']['Tables'][T]['Insert']
    | Database['public']['Tables'][T]['Insert'][],
) => {
  const {data, error} = await from(tableName).insert(newRecord).select();
  if (error) fail(error);
  if (!data?.length)
    throw new Error(`Insert into ${tableName} returned no row`);
  return data[0] as Database['public']['Tables'][T]['Row'];
};

export const updateRecord = async <T extends TableWithId>(
  tableName: T,
  id: string,
  updates: Database['public']['Tables'][T]['Update'],
) => {
  const {error} = await from(tableName).update(updates).eq('id', id);
  if (error) fail(error);
  return true;
};

export const softDelete = async (
  tableName: TableWithSoftDelete,
  id: string,
) => {
  const {error} = await from(tableName).update({is_deleted: true}).eq('id', id);
  if (error) fail(error);
};

export const hardDelete = async (tableName: TableWithId, id: string) => {
  const {error} = await from(tableName).delete().eq('id', id);
  if (error) fail(error);
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
  if (error) fail(error);
  return (data ?? []) as unknown as OrderParentViewRow[];
};

export const getKidOrders = async (kidId: string) => {
  const {data, error} = await supabase
    .from('kid_order_view')
    .select()
    .eq('kid_id', kidId);
  if (error) fail(error);
  return (data ?? []) as KidOrderRow[];
};

export const getParentOrders = async (parentId: string) => {
  const {data, error} = await supabase
    .from('parent_order_view')
    .select()
    .eq('parent_id', parentId);
  if (error) fail(error);
  return (data ?? []) as unknown as ParentOrderRow[];
};

export const getDelivererParents = async (delivererId: string) => {
  const {data, error} = await supabase
    .from('parent')
    .select()
    .eq('is_deleted', false)
    .eq('is_active', true)
    .eq('deliverer_id', delivererId);
  if (error) fail(error);
  return data ?? [];
};

/**
 * Calls the admin-only user-management edge function. The bearer token is the caller's
 * session token; the function verifies it and checks app_metadata.access_level === 'admin'
 * before doing anything. Returns `{error}` on rejection rather than throwing.
 */
export const userManagement = async (token: string, payload: object) => {
  try {
    const response = await fetch(
      supabaseUrl + '/functions/v1/user-management',
      {
        method: 'post',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );
    return await response.json();
  } catch (e) {
    return {error: (e as Error).message};
  }
};
