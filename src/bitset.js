const bitset = {
    fromArray: (xs) => xs.reduce((acc, x) => acc | 1 << x, 0),
    toArray: (bs) => bs.toString(2).split('').reverse().reduce((acc, x, i) => x === '0' ? acc : [...acc, i], []),
    size: (bs) => { let count = 0; while (bs) bs & 1 ? count++ : 0, bs >>= 1; return count; },
    union: (bs1, bs2) => bs1 | bs2,
    intersection: (bs1, bs2) => bs1 & bs2,
    diff: (bs1, bs2) => bs1 & ~bs2,
    xor: (bs1, bs2) => bs1 ^ bs2,
}

module.exports = bitset