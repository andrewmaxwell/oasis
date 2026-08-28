// Admin-only user management. Wraps a small allow-list of supabase.auth.admin methods.
//
// deploy: npx supabase functions deploy user-management
// check:  npm run check:functions   (this file is NOT covered by the app's tsconfig)
// logs:   https://supabase.com/dashboard/project/lsagjnicdssonuenzunb/functions/user-management/logs
//
// SECURITY MODEL — read before changing anything in this file.
//
//  * This function holds the SERVICE ROLE key, which bypasses RLS entirely. Every request
//    must therefore be authorized here, in code. Supabase's `verify_jwt` gate is NOT
//    sufficient: the anon key is itself a valid project-signed JWT and it ships inside the
//    public client bundle, so `verify_jwt` alone would let any visitor in.
//  * `access_level` is read from `app_metadata`, never `user_metadata`. `user_metadata` is
//    writable by the user themselves via `supabase.auth.updateUser({data})`, so trusting it
//    would let any signed-in user promote themselves to admin.
//  * Actions are dispatched through an explicit allow-list. Never go back to indexing
//    `supabase.auth.admin[action]` with a caller-supplied string.

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

// Keep in sync with ACCESS_LEVELS in src/types.ts
const ACCESS_LEVELS = ['readOnly', 'readWrite', 'admin'];

// Well above the realistic number of staff accounts; listUsers() otherwise defaults to a
// silent first page of 50.
const USER_PAGE_SIZE = 1000;

const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://andrewmaxwell.github.io,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin':
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});

const json = (data: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(data), {
    headers: {...corsHeaders(origin), 'Content-Type': 'application/json'},
    status,
  });

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {auth: {autoRefreshToken: false, persistSession: false}},
);

/** Throws unless `value` is one of the three known access levels. */
const assertAccessLevel = (value: unknown) => {
  if (typeof value !== 'string' || !ACCESS_LEVELS.includes(value)) {
    throw new Error(`access_level must be one of: ${ACCESS_LEVELS.join(', ')}`);
  }
  return value;
};

const assertId = (value: unknown) => {
  if (typeof value !== 'string' || !value) throw new Error('id is required');
  return value;
};

const assertEmail = (value: unknown) => {
  if (typeof value !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    throw new Error('A valid email is required');
  }
  return value;
};

/**
 * Splits the flat profile the client sends into the two metadata buckets. Doing this here
 * rather than trusting the client is what keeps `access_level` out of `user_metadata`.
 */
const splitProfile = (profile: Record<string, unknown> = {}) => ({
  email: assertEmail(profile.email),
  user_metadata: {
    name: typeof profile.name === 'string' ? profile.name : '',
    notes: typeof profile.notes === 'string' ? profile.notes : '',
  },
  app_metadata: {access_level: assertAccessLevel(profile.access_level)},
});

/**
 * Guards the "there is always at least one admin" invariant. Without it an admin can demote
 * or delete themselves and leave nobody able to manage users — recoverable only by
 * hand-editing auth.users in the SQL editor.
 */
const refuseSelfLockout = (
  targetId: string,
  callerId: string,
  what: string,
) => {
  if (targetId === callerId) {
    throw new Error(
      `You cannot ${what} your own account. Ask another admin to do it.`,
    );
  }
};

/**
 * Unwraps Supabase's {data, error} envelope, turning `error` into a throw. Modelled as a
 * union because that is what supabase-js returns: on failure `data`'s fields are nulled out,
 * so a single non-union shape does not typecheck.
 */
type Envelope<T> =
  {data: T; error: null} | {data: unknown; error: {message: string}};

const unwrap = <T>(res: Envelope<T>): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

type Handler = (args: unknown[], callerId: string) => Promise<unknown>;

const actions: Record<string, Handler> = {
  listUsers: () =>
    admin.auth.admin.listUsers({perPage: USER_PAGE_SIZE}).then(unwrap),

  getUserById: ([id]) =>
    admin.auth.admin.getUserById(assertId(id)).then(unwrap),

  /**
   * Creates the account AND emails the invite in one step. No password is ever set, so the
   * account cannot be signed into until the invitee chooses one via the invite link.
   */
  inviteUser: async ([profile]) => {
    const {email, user_metadata, app_metadata} = splitProfile(
      profile as Record<string, unknown>,
    );

    const {user} = await admin.auth.admin
      .inviteUserByEmail(email, {data: user_metadata})
      .then(unwrap);

    // app_metadata cannot be set through the invite call, so apply it immediately after.
    // If this second call fails the account exists without a level, which app_access_level()
    // treats as readOnly — safe, but say so plainly rather than reporting success.
    try {
      return await admin.auth.admin
        .updateUserById(user.id, {app_metadata})
        .then(unwrap);
    } catch (error) {
      throw new Error(
        `Invite sent to ${email}, but setting their access level failed ` +
          `(${(error as Error).message}). Open the user and save again.`,
        {cause: error},
      );
    }
  },

  updateUserById: ([id, profile], callerId) => {
    const userId = assertId(id);
    const attributes = splitProfile(profile as Record<string, unknown>);

    if (attributes.app_metadata.access_level !== 'admin') {
      refuseSelfLockout(userId, callerId, 'remove admin access from');
    }
    return admin.auth.admin.updateUserById(userId, attributes).then(unwrap);
  },

  deleteUser: ([id], callerId) => {
    const userId = assertId(id);
    refuseSelfLockout(userId, callerId, 'delete');
    return admin.auth.admin.deleteUser(userId).then(unwrap);
  },
};

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders(origin)});
  }
  if (req.method !== 'POST') {
    return json({error: 'Method not allowed'}, 405, origin);
  }

  try {
    // 1. Authenticate: the bearer token must resolve to a real user. The anon key is a
    //    valid project JWT but identifies no user, so getUser rejects it here.
    const token = (req.headers.get('Authorization') ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    if (!token) return json({error: 'Missing bearer token'}, 401, origin);

    const {data: userData, error: authError} = await admin.auth.getUser(token);
    if (authError || !userData?.user) {
      return json({error: 'Invalid or expired token'}, 401, origin);
    }

    // 2. Authorize: admins only, per app_metadata (server-controlled).
    if (userData.user.app_metadata?.access_level !== 'admin') {
      return json({error: 'Admin access required'}, 403, origin);
    }

    // 3. Dispatch through the allow-list. hasOwnProperty keeps `action` from reaching
    //    inherited members like "constructor" or "toString".
    const {action, args = []} = await req.json();
    if (!Object.prototype.hasOwnProperty.call(actions, action)) {
      return json({error: `Unknown action: ${action}`}, 400, origin);
    }
    if (!Array.isArray(args)) {
      return json({error: 'args must be an array'}, 400, origin);
    }

    return json(await actions[action](args, userData.user.id), 200, origin);
  } catch (error) {
    console.error(error);
    return json({error: (error as Error).message}, 400, origin);
  }
});
