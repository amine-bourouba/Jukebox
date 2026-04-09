import { describe, it, expect } from 'vitest';
import { shuffleArray } from './shuffleArray';

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    expect(shuffleArray([1, 2, 3, 4, 5])).toHaveLength(5);
  });

  it('contains all original elements', () => {
    const result = shuffleArray([1, 2, 3]);
    expect(result).toEqual(expect.arrayContaining([1, 2, 3]));
  });

  it('does not mutate the original array', () => {
    const original = [1, 2, 3];
    shuffleArray(original);
    expect(original).toEqual([1, 2, 3]);
  });

  it('returns empty array for empty input', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('returns single-element array unchanged', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});
