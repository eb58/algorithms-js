const bitset = require('../src/ol').bitset;

test('bitset', () => {
    expect(bitset.toArray(bitset.fromArray([0, 1, 2]))).toEqual([0, 1, 2])
    expect(bitset.toArray(bitset.fromArray([1, 2, 3]))).toEqual([1, 2, 3])
    expect(bitset.toArray(bitset.fromArray([1, 2, 5, 17]))).toEqual([1, 2, 5, 17])
    expect(bitset.size(bitset.fromArray([]))).toBe(0)
    expect(bitset.size(bitset.fromArray([7]))).toBe(1)
    expect(bitset.size(bitset.fromArray([11, 1, 2, 9]))).toBe(4)
})
