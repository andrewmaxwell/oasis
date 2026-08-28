import {describe, expect, it} from 'vitest';
import {getDifference} from './getDifference.ts';

describe('getDifference', () => {
  it('is empty when nothing changed', () => {
    expect(getDifference({a: 1, b: 'x'}, {a: 1, b: 'x'})).toEqual({});
  });

  it('returns only the changed keys, taken from the first object', () => {
    expect(getDifference({a: 1, b: 'x'}, {a: 2, b: 'x'})).toEqual({a: 1});
  });

  it('treats a key missing from the original as changed', () => {
    expect(getDifference({a: 1, b: 'x'}, {a: 1})).toEqual({b: 'x'});
  });

  it('includes a value cleared to empty string', () => {
    expect(getDifference({notes: ''}, {notes: 'old'})).toEqual({notes: ''});
  });

  it('ignores keys present only in the original', () => {
    expect(getDifference({a: 1}, {a: 1, b: 2} as never)).toEqual({});
  });

  it('compares by reference, so an equal object still counts as changed', () => {
    // Why ParentPage strips `kid` before updating: it would always be sent.
    expect(getDifference({kid: [{id: '1'}]}, {kid: [{id: '1'}]})).toEqual({
      kid: [{id: '1'}],
    });
  });

  it('distinguishes null from undefined', () => {
    expect(getDifference({income: null}, {income: undefined})).toEqual({
      income: null,
    });
  });
});
