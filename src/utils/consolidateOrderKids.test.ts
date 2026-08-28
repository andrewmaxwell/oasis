import {describe, expect, it} from 'vitest';
import {consolidateOrderKids} from './consolidateOrderKids.ts';

describe('consolidateOrderKids', () => {
  it('returns None for an empty order', () => {
    expect(consolidateOrderKids([])).toBe('None');
  });

  it('sums the quantities frozen into the order, one row per kid', () => {
    expect(
      consolidateOrderKids([
        {diaper_size: '3', diaper_quantity: 50},
        {diaper_size: '3', diaper_quantity: 50},
        {diaper_size: 'P', diaper_quantity: 75},
      ]),
    ).toBe('75 of size P, 100 of size 3');
  });

  it('trusts the snapshotted quantity over the current size lookup', () => {
    // A past order keeps what it was ordered at, even if the rule changed since.
    expect(
      consolidateOrderKids([{diaper_size: '3', diaper_quantity: 999}]),
    ).toBe('999 of size 3');
  });

  it('sorts by size, not by first appearance', () => {
    expect(
      consolidateOrderKids([
        {diaper_size: '7', diaper_quantity: 50},
        {diaper_size: 'N', diaper_quantity: 75},
      ]),
    ).toBe('75 of size N, 50 of size 7');
  });
});
