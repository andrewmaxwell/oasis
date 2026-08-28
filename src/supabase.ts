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
  OrderKid,
  OrderParent,
  OrderParentViewRow,
  ParentOrderRow,
  TableName,
  ViewName,
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
  'parent' | 'kid' | 'deliverer' | 'order_record' | 'order_kid';

/** The subset of the above that carries an `is_active` flag. */
export type TableWithActiveFlag = 'parent' | 'kid' | 'deliverer';

/**
 * Escape hatch for the generic helpers below: they are parameterised over `TableName`, and
 * supabase-js resolves a row type per literal table, which those generics cannot express.
 * The call sites re-assert the row type — see CLAUDE.md gotcha 6.
 */
const from = (table: TableName | ViewName) =>
  supabase.from(table as TableName) as any;

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

/**
 * A column to sort on, server-side. Sorting belongs next to the query — the views all
 * carry their own `ORDER BY` (see dataModel.sql), and this is how a read of a raw table
 * says the same thing rather than re-sorting the array in the page.
 */
export type SortSpec = {column: string; ascending?: boolean};

export const getAllRecords = async <T extends TableWithSoftDelete>(
  tableName: T,
  orderBy: SortSpec[] = [],
) => {
  let query = from(tableName).select().eq('is_deleted', false);
  for (const {column, ascending = true} of orderBy) {
    query = query.order(column, {ascending});
  }
  const {data, error} = await query;
  if (error) fail(error);
  return (data ?? []) as Database['public']['Tables'][T]['Row'][];
};

/**
 * Counts live, active rows. Narrowed to the tables that actually have `is_active` — the
 * order tables don't, and this used to be labelled "Active" in the UI while counting
 * inactive records too.
 */
/**
 * Where each dashboard count comes from. Kids are counted through `rostered_kid_view`
 * rather than the `kid` table: a kid row's own flags say nothing about whether the family
 * is still there, so counting the table left the children of a deleted or deactivated
 * family on the front page as "active" while nobody was ordering diapers for them. The
 * view is kid's own columns filtered to live, active parents, so the two filters below
 * still mean exactly what they meant against the table.
 */
const COUNT_SOURCE: Record<TableWithActiveFlag, TableName | ViewName> = {
  parent: 'parent',
  kid: 'rostered_kid_view',
  deliverer: 'deliverer',
};

export const getTableCount = async (tableName: TableWithActiveFlag) => {
  const {count, error} = await from(COUNT_SOURCE[tableName])
    .select('*', {count: 'exact', head: true})
    .eq('is_deleted', false)
    .eq('is_active', true);
  if (error) fail(error);
  return count || 0;
};

// Not `keyof Database['public']['Views']`: the `*_options` views back the async select
// options and are deliberately not modelled as row types, so the name stays a plain string.
export const getView = async (viewName: string) => {
  const {data, error} = await supabase.from(viewName as TableName).select();
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

/**
 * The monthly order snapshot, as one transaction (ISSUES #13). Previously this was three
 * separate inserts from the page: a failure in the second or third left a committed but
 * half-populated order_record behind, and the user was navigated into it as if it were
 * complete. `create_order` (dataModel.sql) does the whole thing or none of it.
 *
 * The rows are computed on the client and passed in, because the diaper-quantity rule lives
 * in utils/calcDiaperSizes.ts — see the comment on the function for why it is not in SQL.
 */
export const createOrder = async (
  orderData: Database['public']['Tables']['order_record']['Insert'],
  parents: Omit<OrderParent, 'order_id'>[],
  kids: Omit<OrderKid, 'order_id' | 'is_deleted'>[],
) => {
  // Genuinely typed, unlike the rest of this file: `rpc` checks the arguments against the
  // Functions entry in types.ts, so a renamed column here is a compile error.
  const {data, error} = await supabase.rpc('create_order', {
    order_data: orderData,
    parents,
    kids,
  });
  if (error) fail(error);
  return data;
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
