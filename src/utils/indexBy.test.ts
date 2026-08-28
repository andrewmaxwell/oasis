import {describe, expect, it} from 'vitest';
import {indexBy} from './indexBy.ts';

describe('indexBy', () => {
  it('keys each item by the returned key', () => {
    const rows = [
      {id: 'a', n: 1},
      {id: 'b', n: 2},
    ];
    expect(indexBy(rows, (r) => r.id)).toEqual({a: rows[0], b: rows[1]});
  });

  it('returns an empty object for an empty array', () => {
    expect(indexBy([], (x) => x)).toEqual({});
  });

  it('lets the last item win on a duplicate key', () => {
    const rows = [
      {id: 'a', n: 1},
      {id: 'a', n: 2},
    ];
    expect(indexBy(rows, (r) => r.id)).toEqual({a: rows[1]});
  });
});
