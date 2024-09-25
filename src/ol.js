const ol = (() => {

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // numerical functions
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  const abs = (x) => (x >= 0 ? x : -x);
  const add = (a, b) => a + b;
  const inc = (x) => x + 1;
  const dec = (x) => x - 1;
  const mul = (a, b) => a * b;
  const sqr = (x) => x ** 2;
  const cube = (x) => x ** 3;

  const gcd = (a, b) => (a % b === 0 ? b : gcd(b, a % b));
  const fac = (x) => prod(range(x).map(inc));
  const fib = (x) => (x <= 2 ? 1 : fib(x - 1) + fib(x - 2));

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // string functions
  ///////////////////////////////////////////////////////////////////////////////////////////////////

  const repeat = (s, n) => range(n).map(() => s).join('');
  const blanks = (n) => ol.repeat(' ', n)
  const indent = (s, lev, opts) => feedX({ fillChars: '   ', prompt: '', ...opts }, opts => range(lev).map(() => opts.fillChars).join('') + opts.prompt + s)
  // const randomColor = () =>      '#A2F0D9'
  // https://www.kaggle.com/code/parulpandey/10-useful-string-methods-in-python
  // https://www.pythonmorsels.com/string-methods/#the-most-useful-string-methods
  // const center  = (s, length, fillchar = ' ') => 
  // const count = (s, searchVal ) =>  
  // ljust( ) and rjust( )¶
  // string.zfill(width)


  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // technical functions
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  const id = (x) => x;
  const feedX = (x, f) => f(x);
  const call = (f, ...args) => f(...args);
  const swap = (x, y) => [y, x];
  const clone = (o) => JSON.parse(JSON.stringify(o));

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // predicates
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  const eq = (x, y) => x === y;
  const lt = (x, y) => x < y;
  const lte = (x, y) => x <= y;
  const gt = (x, y) => x > y;
  const gte = (x, y) => x >= y;
  const odd = (x) => x % 2 !== 0;
  const even = (x) => x % 2 === 0;
  const isInInterval = (x, a, b) => a <= x && x <= b;
  const isLeapYear = (x) => (x % 4 === 0 && x % 100 !== 0) || x % 400 === 0;
  const isPrime = (n) => n === 2 || rangeClosed(2, Math.ceil(Math.sqrt(n))).every((m) => n % m !== 0);

  // generate predicates
  // usage: [1,2,3,4,5].filter(gtPred(3)) // -> [4,5]
  const gtPred = (x) => (y) => y > x;
  const gtePred = (x) => (y) => y >= x;
  const ltPred = (x) => (y) => y < x;
  const ltePred = (x) => (y) => y <= x;

  // combine predicates
  // const { not, and, or, gtPred } = ol;
  // [1,2,3,4,5].filter(not(gtPred(3))) # -> [1,2,3]
  // [1,2,3,4,5].filter(and(gtPred(3),ltPred(5))) # -> [4]
  const not = (f) => (x) => !f(x);
  const and = (f, g) => (x) => f(x) && g(x);
  const or = (f, g) => (x) => f(x) || g(x);
  const xor = (f, g) => (x) => !!(f(x) ^ g(x));
  const every = (...fs) => (x) => fs.every((f) => f(x));
  const some = (...fs) => (x) => fs.some((f) => f(x));
  const comb = (f, g) => (x) => f(g(x));

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // compare
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  const cmpNumbers = (x, y) => x - y;
  const cmp = (x, y) => (x === y ? 0 : x < y ? -1 : +1);
  // comparer: generate compare function
  // const books = [
  //   {title: "Faust", author: "Goethe"},
  //   {title: "Die Räuber", author: "Schiller"},
  //   {title: "Wallenstein", author: "Schiller"},
  // ];
  // const cmpByTitle = comparer(o => o.title);
  // books.sort(cmpByTitle)) -> array sorted by title
  const comparer = (proj) => (x, y) => cmp(proj(x), proj(y));
  // comparerByKey: just a shortcut for comparer for objects
  // books.sort(comparerByKey('title))) -> array sorted by title
  const comparerByKey = (key) => comparer((o) => o[key]);

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // random
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  const randomIntInRange = (min, max) => Math.floor(randomInRange(min, max + 1));

  // randomArray(3, 1,2) // i.e. -> [  1.469331797388123,  1.9114774409909974,  1.0951408786565546]
  const randomArray = (n, min, max) => range(n).map(() => randomInRange(min, max));

  // randomIntArray(4, -1, 4) // [ 4, -1, 2, 3]
  const randomIntArray = (n, min, max) => range(n).map(() => randomIntInRange(min, max));

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // arrays
  ///////////////////////////////////////////////////////////////////////////////////////////////////

  // range(3)            // [0,1,2]
  // range(5).map(inc)   // [1,2,3,4,5]
  // range(5).map(()=>0) // [0,0,0,0,0]
  const range = (n) => [...Array(n).keys()];
  const rangeClosed = (a, b) => range(b - a + 1).map((x) => x + a);

  // rangeFilled(3)       // [0, 0, 0]
  // rangeFilled(3,'a')   // ['a', 'a', 'a']
  const rangeFilled = (n, val = 0) => range(n).map(() => val);

  const sum = (xs) => xs.reduce(add, 0);
  const prod = (xs) => xs.reduce(mul, 1);

  // min + max
  // persons     = [ {name:"Max", age: 59}, {name:"Hans", age: 19}, {name:"Johannes", age: 29}]
  // oldest      = max( persons, p => p.age ) # -> {name:"Max", age: 59}
  // youngest    = min( persons, p => p.age ) # -> {name:"Hans", age: 19}
  // longestName = max( persons, p => p.name.length ) # -> {name:"Max", age: 59}
  const max = (xs, proj = id) => xs.reduce((a, x) => (proj(x) > proj(a) ? x : a), xs[0]);
  const min = (xs, proj = id) => xs.reduce((a, x) => (proj(x) < proj(a) ? x : a), xs[0]);

  const randomElem = (xs) => xs[Math.floor(Math.random() * xs.length)];

  const average = (xs) => xs.reduce(add) / xs.length;
  const median = (xs) => ((xs = xs.toSorted()), feedX(xs.length / 2, (mid) => (mid % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid - 0.5])));
  const patch = (xs, idx, val) => xs.with(idx, val);
  const without = (xs, x) => xs.filter((y) => x !== y);
  const withoutIndex = (xs, idx) => xs.filter((_, i) => i !== idx);
  const sort = (xs, cmp) => xs.toSorted(cmp);
  const shuffle = (xs) => xs.reduce((xs, x, i) => (feedX(randomIntInRange(0, xs.length - 1), (j) => ([xs[i], xs[j]] = [xs[j], x])), xs), xs);
  const flatten = (xs) => xs.reduce((acc, o) => acc.concat(Array.isArray(o) ? flatten(o) : o), []);
  const uniq = (xs) => Array.from(new Set(xs));
  const uniqBy = (xs, proj) => Object.values(xs.reduce((a, v) => ({ ...a, [proj(v)]: v }), {}));

  const groupBy = (xs, proj) => xs.reduce((a, v) => feedX(proj(v), (k) => ((a[k] = [...(a[k] || []), v]), a)), {});

  // zip examples
  // zip([1,2,3], [4,5,6])  // -> [[1,4],[2,5],[3,6]]
  // zip([1,2,3], [4,5,6], add ) // -> [5,7,9]
  //    men   = [{name:'hugo', age:36 }, {name:'hans', age:37 }]
  //    women = [{name:'anna', age:35 }, {name:'lena', age:27 }]
  // zip(men, women, (a,b) => ({ 'husband': a, 'wife': b }) ) // -> [{"husband":"hugo","wife":"anna"}, {"husband":"hans","wife":"lena"}]
  const zip = (xs, ys, f) => xs.map((x, i) => (f ? f(x, ys[i]) : [x, ys[i]]));

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // helpers
  ///////////////////////////////////////////////////////////////////////////////////////////////////

  // nobody needs uuid() !!!
  const uid = (prefix = '') => prefix + randomInRange(1_000_000, 9_999_999) + Date.now();

  const timer = (start = Date.now()) => ({ elapsedTime: () => (Date.now() - start) / 1000 })

  // usage:   log(() => callSomeComplicatedFunction(2, 4, 6))
  // example: log(() => sin(2))
  const log = (f) => {
    const t = timer()
    const res = f(args);
    console.log('res:', res, 'time:', t.elapsedTime());
    return res;
  };

  /* Example:
  let fib = (x) => (x <= 2 ? 1 : fib(x - 1) + fib(x - 2));  // 'let' not 'const' for recursive functions!
  fib  = logtor(fib)
  fib(8)
  */
  const logtor = (f, cnt = 0, lev = 0) => (args) => {
    console.log(repeat("..", lev++) + f.name, 'args:' + args);
    const t = timer()
    const res = f(args);
    console.log(repeat("..", --lev) + 'res:', res, '# of calls:', ++cnt, 'time:' + t.elapsedTime());
    return res;
  };
  return {
    abs, add, inc, dec, mul, sqr, cube, gcd, fac, fib, // numerical functions
    repeat, blanks, indent, // string functions
    id, feedX, call, swap, clone,  // technical functions
    eq, lt, lte, gt, gte, odd, even, isInInterval, isLeapYear, isPrime, // predicates
    gtPred, gtePred, ltPred, ltePred, // generate predicates
    not, or, and, xor, comb, every, some, // combine predicates
    cmpNumbers, cmp, comparer, comparerByKey, // compare
    randomArray, randomIntArray, randomInRange, randomIntInRange, // random
    range, rangeClosed, rangeFilled, // arrays
    sum, prod, max, min, randomElem, average, median, patch, without, withoutIndex, sort, shuffle, flatten, uniq, uniqBy, groupBy, zip, // arrays
    uid, timer, log, logtor // helpers
  };
})()

///////////////////////////////////////////////////////////////////////////////////////////////////
// interval
///////////////////////////////////////////////////////////////////////////////////////////////////

const interval = (a, b) => ({
  range: () => [...Array(b - a + 1).keys()].map((x) => x + a),
  contains: (x) => a <= x && x <= b,
  intersects: (x, y) => !(y < a || x > b),

  // inc/dec x, but stay in interval
  inc: (x) => (x >= b ? b : x + 1),
  dec: (x) => (x <= a ? a : x - 1),

  random: () => ol.randomInRange(a, b),
  randomInt: () => ol.randomIntInRange(a, b)
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Wrappers
///////////////////////////////////////////////////////////////////////////////////////////////////

const num = (x) => ({
  abs: () => ol.abs(x),
  sqr: () => ol.sqr(x),
  cube: () => ol.cube(x),
  isInInterval: (a, b) => ol.isInInterval(x, a, b)
});

const array = (xs) => ({
  sum: () => ol.sum(xs),
  prod: () => ol.prod(xs),
  max: () => ol.max(xs),
  min: () => ol.min(xs),
  average: () => ol.average(xs),
  median: () => ol.median(xs),

  patch: (idx, val) => ol.patch(xs, idx, val),
  without: (x) => ol.without(xs, x),
  withoutIndex: (idx) => ol.withoutIndex(idx),
  shuffle: () => ol.shuffle(xs),
  flatten: () => ol.flatten(xs),
  uniq: () => ol.uniq(xs),
  uniqBy: (proj) => ol.uniqBy(xs, proj),

  groupBy: (proj) => ol.groupBy(xs, proj),
  zip: (ys, f) => ol.zip(xs, ys, f),

  initial: () => xs.slice(0, -1),
  head: () => [xs[0]],
  tail: () => xs.slice(1),
  rest: () => xs.slice(1),
  first: () => xs[0],
  last: () => xs[xs.length - 1],
  unite: (ys) => ol.uniq([...xs, ...ys]),
  xor: (ys) => [...xs, ...ys].filter((x) => !(xs.includes(x) && ys.includes(x))),
  intersect: (ys) => xs.filter((x) => ys.includes(x)),
  subtract: (ys) => xs.filter((x) => !ys.includes(x)),
  greaterThen: (a) => xs.filter(gtPred(a)),
  lesserThen: (a) => xs.filter(ltPred(a)),
  isSubsetOf: (ys) => ys.every((x) => xs.includes(x)),
  tap: (f) => (f(xs), xs)
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// vector
///////////////////////////////////////////////////////////////////////////////////////////////////

const vector = {
  vadd: (v1, v2) => ol.zip(v1, v2, ol.add),
  vsqrdist: (v1, v2) => ol.zip(v1, v2, (x, y) => (x - y) ** 2),
  vdist: (v1, v2) => Math.sqrt(vector.vsqrdist(v1, v2)),
  vscalar: (v1, v2) => ol.sum(ol.zip(v1, v2, mul)),
  vnorm: (v) => Math.sqrt(vector.vscalar(v, v)),
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// matrix
///////////////////////////////////////////////////////////////////////////////////////////////////
const matrix = {
  clone: (m) => m.map((r) => [...r]),
  reshape: (m, dim) => m.reduce((acc, x, i) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []),
  redim: (m, nrows, ncols, defVal = 0) => ol.range(nrows).map((r) => ol.range(ncols).map((c) => m[r]?.[c] || defVal)),
  makeQuadratic: (m, defVal = 0) => ol.feedX(Math.max(m.length, m[0].length), (dim) => matrix.redim(m, dim, dim, defVal)),
  transpose: (m) => m[0].map((_, i) => m.map((r) => r[i])),
  translate: (m, dr, dc, defVal = 0) => ol.range(m.length).map((r) => ol.range(m[0].length).map((c) => m[r - dr]?.[c - dc] || defVal)),
  rotate90: (m) => m[0].map((_, idx) => m.map((r) => r[r.length - idx - 1])),
  rotateN90: (m, n) => ol.range(n).reduce(matrix.rotate90, m)
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// caching
//////////////////////////////////////////////////////////////////////////////////////////////////

const simpleCache = (c = {}) => ({ add: (key, val) => c[key] = val, get: key => c[key] })

const cache = (ttl = 1, c = {}) => ({ // ttl = time to live in secs - 0 meaning live forever 
  add: (key, val) => c[key] = { val, validUntil: Date.now() + (ttl || 3600 * 1000) * 1000 }, // 3600 * 1000 -> 1000 hours -> living almost forever!
  get: key => Date.now() < c[key]?.validUntil ? c[key].val : undefined,
  cleaner: () => c = Object.keys(c).filter(k => c[k].validUntil >= Date.now()).reduce((acc, k) => ({ ...acc, [k]: c[k] }), {})
})

const memoize = (f, c = cache()) => (x) => c.get(x) === undefined ? c.add(x, f(x)).val : c.get(x)

///////////////////////////////////////////////////////////////////////////////////////////////////
// bitset
///////////////////////////////////////////////////////////////////////////////////////////////////
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
  sum: (bs) => bitset.toArray(bs).reduce(ol.add, 0),
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
    let cnt = 0;
    let i = 0;
    while (i <= bitset.MAX && cnt <= n) {
      if (bs & (1 << i)) cnt++;
      i++;
    }
    if (i === 0 || i > bitset.MAX) throw Error('Wrong index ' + n);
    return i - 1;
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////

if (typeof module !== 'undefined')
  module.exports = {
    ol,
    num,
    interval,
    array,
    bitset,
    vector,
    matrix,
    simpleCache,
    cache,
    memoize
  };
