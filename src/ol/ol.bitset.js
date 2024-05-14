const add = require('./ol').ol.add;

const bitset = {
  MAX: 32,
  fromArray: (xs) => xs.reduce((acc, x) => acc | (1 << x), 0),
  toArray: (bs) => {
    const res = [];
    let i = 0;
    while (bs) {
      if (bs & 1) res.push(i);
      i++;
      bs >>= 1;
    }
    return res;
  },
  size: (bs) => {
    let count = 0;
    while (bs) bs & 1 ? count++ : 0, (bs >>= 1);
    return count;
  },

  add: (bs, v) => bs | (1 << v),
  rm: (bs, v) => bs & ~(1 << v),
  set: (bs, n, v) => bs | ((v ? 1 : 0) << n),
  isEmpty: (bs) => bs === 0,
  sum: (bs) => bitset.toArray(bs).reduce(add, 0),
  union: (bs1, bs2) => bs1 | bs2,
  intersection: (bs1, bs2) => bs1 & bs2,
  diff: (bs1, bs2) => bs1 & ~bs2,
  xor: (bs1, bs2) => bs1 ^ bs2,
  isSubset: (bs1, bs2) => (bs1 & ~bs2) === 0,
  has: (bs, v) => !!(bs & (1 << v)),
  includes: (bs, v) => !!(bs & (1 << v)),
  contains: (bs, n) => !!(bs & (1 << n)),
  slice: (bs, n) => {
    let res = 0;
    let i = 0;
    let cnt = 0;
    while (i <= bitset.MAX && cnt < n) {
      if (bs & (1 << i)) cnt++;
      i++;
    }
    for (let j = i; j < bitset.MAX; j++) {
      res |= bs & (1 << j);
    }
    return res;
  },
  at: (bs, n) => {
    let i = (cnt = 0);
    while (i <= bitset.MAX && cnt <= n) {
      if (bs & (1 << i)) cnt++;
      i++;
    }
    if (i === 0 || i > bitset.MAX) throw Error('Wrong index ' + n);
    return i - 1;
  },
};

if (typeof module !== 'undefined') module.exports = bitset;
