import {describe, expect, it} from 'vitest';
import {DIAPER_SIZES, DiaperSize, Kid, Parent} from '../types.ts';
import {
  calcDiaperSizes,
  formatCounts,
  getDiaperQuantity,
} from './calcDiaperSizes.ts';

const kid = (diaper_size: DiaperSize, is_active = true): Kid => ({
  id: `kid-${diaper_size}-${is_active}`,
  parent_id: 'p1',
  first_name: 'Chidi',
  last_name: 'Okafor',
  gender: 'M',
  diaper_size,
  is_active,
  created_at: '2026-01-01',
  modified_at: '2026-01-01',
  is_deleted: false,
});

const parent = (kids: Kid[], is_active = true): Parent => ({
  id: 'p1',
  first_name: 'Amara',
  last_name: 'Okafor',
  address: '1 Main St',
  city: 'Springfield',
  zip: '12345',
  country_of_origin: 'Nigeria',
  is_active,
  created_at: '2026-01-01',
  modified_at: '2026-01-01',
  is_deleted: false,
  kid: kids,
  deliverer_id: 'd1',
});

describe('getDiaperQuantity', () => {
  // The business rule that costs the org money if it is wrong.
  it.each([
    ['P', 75],
    ['N', 75],
    ['1', 75],
    ['2', 50],
    ['3', 50],
    ['4', 50],
    ['5', 50],
    ['6', 50],
    ['7', 50],
  ] as const)('gives %s %d diapers', (size, expected) => {
    expect(getDiaperQuantity(size)).toBe(expected);
  });

  it('has a quantity for every declared size', () => {
    for (const size of DIAPER_SIZES) {
      expect(getDiaperQuantity(size)).toBeGreaterThan(0);
    }
  });
});

describe('formatCounts', () => {
  it('says None when there is nothing to order', () => {
    expect(formatCounts({})).toBe('None');
  });

  it('lists sizes in DIAPER_SIZES order, not insertion or alpha order', () => {
    // Object keys come back numeric-first, so '2' would lead without the sort.
    expect(formatCounts({2: 50, P: 75, 7: 50, N: 75})).toBe(
      '75 of size P, 75 of size N, 50 of size 2, 50 of size 7',
    );
  });

  it('formats a single size', () => {
    expect(formatCounts({4: 100})).toBe('100 of size 4');
  });

  it('keeps a zero count rather than dropping it', () => {
    expect(formatCounts({4: 0})).toBe('0 of size 4');
  });
});

describe('calcDiaperSizes', () => {
  it('returns None for no parents', () => {
    expect(calcDiaperSizes([])).toBe('None');
  });

  it('sums quantities per size across families', () => {
    expect(
      calcDiaperSizes([parent([kid('3'), kid('3')]), parent([kid('N')])]),
    ).toBe('75 of size N, 100 of size 3');
  });

  it('skips inactive kids', () => {
    expect(calcDiaperSizes([parent([kid('3'), kid('4', false)])])).toBe(
      '50 of size 3',
    );
  });

  it('skips every kid of an inactive parent, active or not', () => {
    expect(calcDiaperSizes([parent([kid('3')], false)])).toBe('None');
  });

  it('ignores a parent with no kids', () => {
    expect(calcDiaperSizes([parent([]), parent([kid('7')])])).toBe(
      '50 of size 7',
    );
  });
});
