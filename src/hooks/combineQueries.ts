/**
 * Several hooks load a record and its related rows as two parallel queries, and every page
 * that consumes them wants the same two things: the first error, and one way to retry
 * everything. Returns exactly that.
 *
 * Takes anything query-shaped — a `useQuery` result, or another hook that already returns
 * `{error, refetch}` — so combinations can be nested.
 */
export const combineQueries = (
  ...queries: {error: unknown; refetch: () => unknown}[]
) => ({
  error: queries.find((q) => q.error)?.error ?? null,
  refetch: () => queries.forEach((q) => q.refetch()),
});
