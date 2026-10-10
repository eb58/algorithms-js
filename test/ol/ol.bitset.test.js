const { bitset }= require('../../src/ol');
test('bitset', () => {

    const bs = bitset.fromArray([11, 1, 2, 9]);
    expect(bitset.add(bs, 3)).toBe(bitset.fromArray([1, 2, 3, 9, 11]));
    expect(bitset.has(bs, 2)).toBe(true);
    expect(bitset.has(bs, 30)).toBe(false);

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

    expect(bitset.has(bs1, 2)).toBe(true);
    expect(bitset.has(bs1, 12)).toBe(false);

    expect(bitset.sum(bs)).toBe(23);
    expect(bitset.toArray(bitset.slice(bs1, 0))).toEqual([1, 2, 9, 11]);
    expect(bitset.toArray(bitset.slice(bs1, 2))).toEqual([9, 11]);
    expect(bitset.toArray(bitset.slice(bs1, 4))).toEqual([]);
    expect(bitset.at(bs1, 0)).toBe(1);
    expect(bitset.at(bs1, 3)).toBe(11);
    expect(() => bitset.at(bs1, 4)).toThrow('Wrong index 4');
});

test('bitset with bit 31 (negative number)', () => {
    const bs = bitset.fromArray([0, 31]);
    expect(bitset.toArray(bs)).toEqual([0, 31]);
    expect(bitset.size(bs)).toBe(2);
    expect(bitset.toArray(bitset.fromArray([31]))).toEqual([31]);
    expect(bitset.size(bitset.fromArray([30, 31]))).toBe(2);
});

test('bitset set sets and clears a bit', () => {
    const bs = bitset.fromArray([0, 2]);
    expect(bitset.set(bs, 1, true)).toBe(bitset.fromArray([0, 1, 2]));
    expect(bitset.set(bs, 2, false)).toBe(bitset.fromArray([0]));
    expect(bitset.set(bs, 0, 0)).toBe(bitset.fromArray([2]));
    expect(bitset.set(bs, 3, 0)).toBe(bs);
    expect(bitset.set(bs, 2, 1)).toBe(bs);
});