import {describe, expect, it} from 'vitest';
import {groupBy} from './groupBy.ts';

describe('groupBy', () => {
  it('groups by the returned key, preserving order within a group', () => {
    const rows = [
      {zip: '12345', name: 'a'},
      {zip: '99999', name: 'b'},
      {zip: '12345', name: 'c'},
    ];
    expect(groupBy(rows, (r) => r.zip)).toEqual({
      12345: [rows[0], rows[2]],
      99999: [rows[1]],
    });
  });

  it('returns an empty object for an empty array', () => {
    expect(groupBy([], (x) => x)).toEqual({});
  });

  it('keeps every item when they all share a key', () => {
    expect(groupBy([1, 2, 3], () => 'all')).toEqual({all: [1, 2, 3]});
  });
});
