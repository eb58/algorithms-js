const bitset = {
    fromArray: (xs) => xs.reduce((acc, x) => acc | 1 << x, 0),
    toArray: (bs) => bs.toString(2).split('').reverse().reduce((acc, x, i) => x === '0' ? acc : [...acc, i], []),
    size: (bs) => {
        bs = bs - ((bs >> 1) & 0x55555555)
        bs = (bs & 0x33333333) + ((bs >> 2) & 0x33333333)
        return ((bs + (bs >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
    },
    union: (bs1, bs2) => bs1 | bs2,
    intersection: (bs1, bs2) => bs1 & bs2,
    diff: (bs1, bs2) => bs1 & ~bs2,
    xor: (bs1, bs2) => bs1 ^ bs2,
}

module.exports = bitset