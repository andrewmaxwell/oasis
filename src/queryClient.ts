import {QueryClient} from '@tanstack/react-query';

/**
 * One client for the whole app. Defaults chosen for this app's shape: a handful of staff
 * looking at a roster that changes a few times a day, often on a flaky phone connection.
 *
 * `retry` matters more than usual here — a dropped request in a car used to leave the page
 * on a spinner forever (ISSUES #9); now it retries, and if it still fails the page renders
 * an error with a Retry button instead of hanging.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Query keys in one place so a mutation can invalidate exactly what it changed. */
export const queryKeys = {
  table: (name: string) => ['table', name] as const,
  view: (name: string) => ['view', name] as const,
  count: (name: string) => ['count', name] as const,
  record: (table: string, id: string) => ['record', table, id] as const,
  kidsForParent: (parentId: string) => ['kidsForParent', parentId] as const,
  parentOrders: (parentId: string) => ['parentOrders', parentId] as const,
  kidOrders: (kidId: string) => ['kidOrders', kidId] as const,
  orderParents: (orderId: string) => ['orderParents', orderId] as const,
  delivererParents: (id: string) => ['delivererParents', id] as const,
  options: (key: string) => ['options', key] as const,
  users: () => ['users'] as const,
  user: (id: string) => ['user', id] as const,
};
