import {useEffect, useRef} from 'react';
import {useBlocker} from 'react-router-dom';
import {useConfirm} from './useConfirm.ts';

/**
 * Set by `allowNextNavigation()` and consumed by the next blocker check. This is a
 * module-level flag rather than a prop or state because it has to be readable
 * *synchronously* inside the same tick as the `navigate()` call that follows it — a
 * re-render never happens in between. Same reason `useSession` keeps a module store.
 */
let allowed = false;

/**
 * Suppress the unsaved-changes prompt for the navigation that happens next.
 *
 * Call this immediately before `navigate()` in a mutation's `onSuccess` — after a save or
 * a delete the form may still be dirty, but the user already got their confirmation and a
 * toast, so a second "discard your changes?" dialog is noise.
 */
export const allowNextNavigation = () => {
  allowed = true;
  // If the caller never actually navigates, don't leave the flag armed to swallow a real
  // prompt later. `navigate()` runs the blocker synchronously, so a macrotask is late
  // enough to be safe.
  setTimeout(() => {
    allowed = false;
  }, 0);
};

/**
 * Blocks in-app navigation and browser unload while a form has unsaved edits (ISSUES #26).
 *
 * `useBlocker` needs a data router — this app has one (`createHashRouter` in App.tsx) —
 * and React Router supports only one active blocker at a time, so this must stay to one
 * call per page. `OasisForm` is the single caller.
 */
export const useUnsavedChangesPrompt = (when: boolean) => {
  const confirm = useConfirm();

  const blocker = useBlocker(({currentLocation, nextLocation}) => {
    if (allowed) {
      allowed = false;
      return false;
    }
    return when && currentLocation.pathname !== nextLocation.pathname;
  });

  // The blocker's identity changes whenever router state does, so the effect below can
  // re-run while a dialog is already open. `promptingRef` keeps that to one dialog per
  // blocked navigation; `proceed` and `reset` stay valid across those re-renders because
  // they're bound to the blocker's key, not to this particular object.
  const promptingRef = useRef(false);

  useEffect(() => {
    if (blocker.state !== 'blocked' || promptingRef.current) return;
    promptingRef.current = true;
    confirm({
      title: 'Discard your changes?',
      message:
        'This form has edits that have not been saved. Leaving this page will lose them.',
      confirmLabel: 'Discard',
      destructive: true,
    }).then((ok) => {
      promptingRef.current = false;
      if (ok) blocker.proceed?.();
      else blocker.reset?.();
    });
  }, [blocker, confirm]);

  // Closing the tab or hitting reload is outside the router's reach; only the browser's
  // own generic dialog can cover that.
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [when]);
};
