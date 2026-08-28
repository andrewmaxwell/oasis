import {Page, Route, expect} from '@playwright/test';
import {Database, Row, seed, views} from './database.ts';

/**
 * A small stand-in for the parts of Supabase this app talks to: PostgREST reads, inserts
 * and updates, the password grant, and the realtime socket.
 *
 * It implements only the query surface `src/supabase.ts` actually uses — `select=*`,
 * `col=eq.value` filters, `count=exact` HEAD requests, and `return=representation`
 * inserts. Anything outside that fails loudly rather than silently returning [], because a
 * mock that quietly answers a query it does not understand is worse than no mock at all.
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

    if (name in views) {
      const rows = applyFilters(views[name](db), params);
      return json(route, rows);
    }

    const table = db[name as keyof Database];
    if (!table) {
      throw new Error(`supabaseMock: unknown table or view "${name}"`);
    }

    if (method === 'GET' || method === 'HEAD') {
      const rows = applyFilters(table, params);
      // count=exact + head:true is how getTableCount asks for a number without the rows.
      const headers: Record<string, string> = request
        .headers()
        .prefer?.includes('count=exact')
        ? {'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`}
        : {};
      return json(route, method === 'HEAD' ? [] : rows, headers);
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
