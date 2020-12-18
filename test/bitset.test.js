const bitset = require('../src/bitset');

test('bitset', () => {
    
    expect(bitset.size(bitset.fromArray([]))).toBe(0);
    expect(bitset.size(bitset.fromArray([7]))).toBe(1);
    expect(bitset.size(bitset.fromArray([11, 1, 2, 9]))).toBe(4);

    expect(bitset.toArray(bitset.fromArray([]))).toEqual([]);
    expect(bitset.toArray(bitset.fromArray([1]))).toEqual([1]);
    expect(bitset.toArray(bitset.fromArray([0, 1, 2]))).toEqual([0, 1, 2]);
    expect(bitset.toArray(bitset.fromArray([1, 2, 3]))).toEqual([1, 2, 3]);
    expect(bitset.toArray(bitset.fromArray([1, 2, 5, 17]))).toEqual([1, 2, 5, 17]);

    expect(bitset.fromArray([11, 1, 2, 9])).toBe(bitset.fromArray([1, 2, 9, 11]));

    const bs1 = bitset.fromArray([1, 2, 9, 11]);
    const bs2 = bitset.fromArray([11, 12]);

    expect(bitset.union(bs1, bs2)).toBe(bitset.fromArray([1, 2, 9, 11, 12]));
    expect(bitset.intersection(bs1, bs2)).toBe(bitset.fromArray([11]));
    expect(bitset.diff(bs1, bs2)).toBe(bitset.fromArray([1, 2, 9]));
    expect(bitset.xor(bs1, bs2)).toBe(bitset.fromArray([1, 2, 9, 12]));

});
