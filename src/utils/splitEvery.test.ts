import {describe, expect, it} from 'vitest';
import {splitEvery} from './splitEvery.ts';

describe('splitEvery', () => {
  it('splits into full chunks', () => {
    expect(splitEvery(2, [1, 2, 3, 4])).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('leaves a short final chunk', () => {
    // The label sheet is 10-up; the last page is usually partial.
    expect(splitEvery(3, [1, 2, 3, 4])).toEqual([[1, 2, 3], [4]]);
  });

  it('returns no chunks for an empty input', () => {
    expect(splitEvery(10, [])).toEqual([]);
  });

  it('handles a chunk larger than the input', () => {
    expect(splitEvery(10, [1, 2])).toEqual([[1, 2]]);
  });

  it('throws on a size below 1 rather than looping forever', () => {
    expect(() => splitEvery(0, [1])).toThrow('Size must be at least 1.');
    expect(() => splitEvery(-1, [1])).toThrow('Size must be at least 1.');
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    splitEvery(2, input);
    expect(input).toEqual([1, 2, 3]);
  });
});
