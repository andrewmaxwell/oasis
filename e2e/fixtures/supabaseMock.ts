import {Page, Route, expect} from '@playwright/test';
import {Database, Row, seed, views} from './database.ts';

/**
 * A small stand-in for the parts of Supabase this app talks to: PostgREST reads, inserts
 * and updates, the password grant, and the realtime socket.
 *
 * It implements only the query surface `src/supabase.ts` actually uses — `select=*`,
 * `col=eq.value` filters, `order=col.asc`, `count=exact` HEAD requests,
 * `return=representation` inserts, and the `create_order` RPC. Anything outside that fails
 * loudly rather than silently returning [], because a mock that quietly answers a query it
 * does not understand is worse than no mock at all.
 */

const RESERVED = new Set([
  'select',
  'order',
  'limit',
  'offset',
  'columns',
  'on_conflict',
]);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,HEAD,OPTIONS',
  'access-control-expose-headers': 'content-range',
};

const json = (
  route: Route,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {...CORS, ...headers},
    body: JSON.stringify(body),
  });

/** PostgREST spells scalars as strings; turn them back into what the fixtures hold. */
const coerce = (raw: string) => {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  return raw;
};

const applyFilters = (rows: Row[], params: URLSearchParams) => {
  let out = rows;
  for (const [column, raw] of params) {
    if (RESERVED.has(column)) continue;
    const dot = raw.indexOf('.');
    const operator = raw.slice(0, dot);
    const value = coerce(raw.slice(dot + 1));
    if (operator !== 'eq') {
      throw new Error(
        `supabaseMock: unsupported filter "${column}=${raw}". Add it here if the app now needs it.`,
      );
    }
    out = out.filter((row) => row[column] === value);
  }
  return out;
};

/** Postgres' default collation order, near enough for the fixture's ASCII-ish data. */
const compare = (a: unknown, b: unknown) => {
  if (a === b) return 0;
  // PostgREST puts nulls last by default.
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

/**
 * `order=is_active.desc,name.asc`, as supabase-js spells `.order()`. Sorting lives in the
 * query now (`getAllRecords` in src/supabase.ts) and in the views, so a mock that ignored
 * this would hand the app rows in insertion order and quietly disagree with production
 * about what the roster looks like.
 */
const applyOrder = (rows: Row[], params: URLSearchParams) => {
  const spec = params.get('order');
  if (!spec) return rows;
  const keys = spec.split(',').map((part) => {
    const [column, ...modifiers] = part.split('.');
    const unsupported = modifiers.filter((m) => m !== 'asc' && m !== 'desc');
    if (unsupported.length) {
      throw new Error(
        `supabaseMock: unsupported order modifier "${unsupported.join('.')}" in "${part}". Add it here if the app now needs it.`,
      );
    }
    return {column, descending: modifiers.includes('desc')};
  });
  return [...rows].sort((a, b) => {
    for (const {column, descending} of keys) {
      const result = compare(a[column], b[column]);
      if (result) return descending ? -result : result;
    }
    return 0;
  });
};

let idCounter = 0;
const nextId = () =>
  `00000000-0000-4000-8000-${String(++idCounter).padStart(12, '0')}`;

const DEFAULTS: Record<string, Row> = {
  parent: {is_active: true, is_deleted: false, notes: null},
  kid: {is_active: true, is_deleted: false, notes: null},
  deliverer: {is_active: true, is_deleted: false, notes: null},
  order_record: {is_deleted: false, notes: null},
  order_parent: {},
  order_kid: {is_deleted: false},
};

/** The order tables are keyed by (order_id, …) rather than an id of their own. */
const HAS_ID = new Set(['parent', 'kid', 'deliverer', 'order_record']);

/**
 * `create_order` from dataModel.sql, reimplemented the same way the views are: this suite
 * mocks the network boundary, so a Postgres function the app now depends on has to exist
 * here too. Two behaviors are load-bearing and mirror the real thing deliberately —
 *
 *   - it is all-or-nothing, so a rejected call leaves no order_record behind (ISSUES #13);
 *   - it rejects a payload naming the same family or child twice, the way the composite
 *     primary keys do (ISSUES #14). Note that is the only duplicate this can produce: each
 *     call mints a fresh order_id, so a retry makes a second *order*, visible in the Orders
 *     list, rather than silently inflating the totals of an existing one.
 */
const createOrder = (db: Database, args: Row) => {
  const orderData = (args.order_data ?? {}) as Row;
  const parents = (args.parents ?? []) as Row[];
  const kids = (args.kids ?? []) as Row[];

  if (!parents.length) {
    throw new Error('An order must include at least one family');
  }

  const orderId = nextId();
  const orderParents = parents.map((p) => ({
    ...DEFAULTS.order_parent,
    order_id: orderId,
    parent_id: p.parent_id,
    deliverer_id: p.deliverer_id ?? null,
  }));
  const orderKids = kids.map((k) => ({
    ...DEFAULTS.order_kid,
    order_id: orderId,
    kid_id: k.kid_id,
    diaper_size: k.diaper_size,
    diaper_quantity: k.diaper_quantity,
  }));

  const duplicated = (rows: Row[], key: string) =>
    new Set(rows.map((r) => String(r[key]))).size !== rows.length;
  if (
    duplicated(orderParents, 'parent_id') ||
    duplicated(orderKids, 'kid_id')
  ) {
    throw new Error('duplicate key value violates unique constraint');
  }

  // Everything above can throw; nothing is written until here, which is what makes this
  // atomic in the same way the real function's transaction is.
  db.order_record.push({
    ...DEFAULTS.order_record,
    id: orderId,
    date_of_order: orderData.date_of_order,
    date_of_pickup: orderData.date_of_pickup,
    notes: orderData.notes || null,
  });
  db.order_parent.push(...orderParents);
  db.order_kid.push(...orderKids);

  return orderId;
};

export type MockHandle = {
  /** The mock's current rows — assert against this to check what the app actually wrote. */
  db: Database;
};

export const mockSupabase = async (page: Page): Promise<MockHandle> => {
  const db = seed();
  const handle: MockHandle = {db};

  // Registered FIRST on purpose: Playwright matches routes in reverse order of
  // registration, so this catch-all is the lowest-priority handler and only sees requests
  // the specific routes below did not claim. An unmocked external request fails the test
  // rather than escaping — that is what stops a stray real URL from reaching production.
  await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => {
    expect(
      route.request().url(),
      'unmocked external request — extend supabaseMock instead of letting this through',
    ).toBe('(no external requests)');
  });

  // Realtime: useTable subscribes on the new-order page. Left unanswered, supabase-js
  // reconnects on a timer and floods the console; an accepted socket that says nothing
  // is the quiet equivalent of "no changes since you loaded".
  await page.routeWebSocket(/\/realtime\/v1\//, () => {});

  await page.route('**/auth/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS, body: ''});
    }
    if (url.pathname.endsWith('/token')) {
      return json(route, {
        access_token: 'e2e-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'e2e-refresh-token',
        user: {
          id: '99999999-9999-4999-8999-999999999999',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'staff@oasis4refugees.org',
          // Read by useAccessLevel. It must be app_metadata, never user_metadata — see
          // CLAUDE.md §4; a readWrite level in user_metadata would be self-granted.
          app_metadata: {access_level: 'readWrite', provider: 'email'},
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      });
    }
    if (url.pathname.endsWith('/logout')) {
      return route.fulfill({status: 204, headers: CORS, body: ''});
    }
    return json(route, {});
  });

  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS, body: ''});
    }

    const url = new URL(request.url());
    const [, name] = url.pathname.split('/rest/v1/');
    const params = url.searchParams;

    if (name.startsWith('rpc/')) {
      if (name !== 'rpc/create_order') {
        throw new Error(`supabaseMock: unknown function "${name}"`);
      }
      try {
        return json(route, createOrder(db, request.postDataJSON() as Row));
      } catch (e) {
        // PostgREST turns a RAISE EXCEPTION into a 400 with the message in `message`,
        // which is the shape supabase-js hands to `fail()`.
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          headers: CORS,
          body: JSON.stringify({message: (e as Error).message}),
        });
      }
    }

    const table = name in views ? views[name](db) : db[name as keyof Database];
    if (!table) {
      throw new Error(`supabaseMock: unknown table or view "${name}"`);
    }

    if (method === 'GET' || method === 'HEAD') {
      const rows = applyOrder(applyFilters(table, params), params);
      // count=exact + head:true is how getTableCount asks for a number without the rows.
      // Views answer it too: the kid count reads rostered_kid_view.
      const headers: Record<string, string> = request
        .headers()
        .prefer?.includes('count=exact')
        ? {'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`}
        : {};
      return json(route, method === 'HEAD' ? [] : rows, headers);
    }

    if (name in views) {
      throw new Error(
        `supabaseMock: unsupported method ${method} on view "${name}"`,
      );
    }

    if (method === 'POST') {
      const payload = request.postDataJSON() as Row | Row[];
      const incoming = Array.isArray(payload) ? payload : [payload];
      const inserted = incoming.map((values) => {
        const row: Row = {
          ...DEFAULTS[name],
          ...(HAS_ID.has(name) ? {id: nextId()} : {}),
          ...values,
        };
        table.push(row);
        return row;
      });
      return json(route, inserted, {}); // Prefer: return=representation
    }

    if (method === 'PATCH') {
      const updates = request.postDataJSON() as Row;
      for (const row of applyFilters(table, params)) {
        Object.assign(row, updates);
      }
      return json(route, []);
    }

    throw new Error(`supabaseMock: unsupported method ${method} on ${name}`);
  });

  return handle;
};

/** Signs in through the real form, so the auth path is part of every test's coverage. */
export const signIn = async (page: Page) => {
  await page.goto('/oasis/');
  await page.getByLabel('Email Address').fill('staff@oasis4refugees.org');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', {name: 'Sign In'}).click();
};
