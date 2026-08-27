import {Session} from '@supabase/supabase-js';
import {useSyncExternalStore} from 'react';
import {getSession, onAuthStateChange} from '../supabase.ts';

type SessionState = {
  session: Session | null;
  /** False until the stored session has been read, so "logged out" and "not yet known"
   *  can be told apart. Without this every consumer treats the first render as
   *  unauthenticated and flashes a sign-in form / "Access Denied" / a disabled form. */
  loaded: boolean;
};

// One shared store rather than per-component state: useSession is called from the router,
// the toolbar, and the access-level hooks, and each copy would otherwise run its own
// getSession() round-trip and start from null on every mount.
let state: SessionState = {session: null, loaded: false};
const listeners = new Set<() => void>();

const setState = (next: SessionState) => {
  state = next;
  listeners.forEach((notify) => notify());
};

getSession().then(({data}) => setState({session: data.session, loaded: true}));
onAuthStateChange((_, session) => setState({session, loaded: true}));

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSessionState = () =>
  useSyncExternalStore(subscribe, () => state);

export const useSession = () => useSessionState().session;
