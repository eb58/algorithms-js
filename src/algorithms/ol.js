const ol = {
  id: (x) => x,
  abs: (x) => (x >= 0 ? x : -x),
  sqr: (x) => x * x,
  cube: (x) => x * x * x,
  fac: (x) => ol.range(x).reduce((acc, n) => acc * (n + 1), 1),
  fib: (x) => (x <= 2 ? 1 : ol.fib(x - 1) + ol.fib(x - 2)),
  randomInRange: (min, max) => Math.random() * (max - min) + min,
  randomIntInRange: (min, max) => Math.floor(ol.randomInRange(min, max + 1)),
  feedx: (x, f) => f(x),

  // predicates
  odd: (x) => x % 2 !== 0,
  even: (x) => x % 2 === 0,
  ininterval: (x, a, b) => a <= x && x <= b,
  leapyear: (x) => (x % 4 === 0 && x % 100 !== 0) || x % 400 === 0,

  // cmp
  cmp: (x, y) => (x === y ? 0 : x < y ? -1 : +1),

  // arrays
  range: (n) => [...Array(n).keys()],
  rangeFilled: (n, val) => [...Array(n).keys()].map(() => val),
  randomArray: (n, min, max) => ol.range(n).map(() => ol.randomInRange(min, max)),
  randomIntArray: (n, min, max) => ol.range(n).map(() => ol.randomIntInRange(min, max)),
  sum: (xs) => xs.reduce((acc, x) => acc + x, 0),
  without: (xs, x) => xs.filter((y) => x !== y),
  withoutIndex: (xs, idx) => xs.filter((_, i) => i !== idx),
  sort: (cmp) => (xs.sort(cmp), xs),
  //
  add2arr: (a, v) => (a ? [...a, v] : [v]),
  add2obj: (o, k, v) => ((o[k] = ol.add2arr(o[k], v)), o),
};

// Wrappers
const num = (x) => ({
  id: () => ol.id(x),
  abs: () => ol.abs(x),
  sqr: () => ol.sqr(x),
  cube: () => ol.cube(x),
  ininterval: (a, b) => ol.ininterval(x, a, b),
});

const interval = (a, b) => ({
  array: () => [...Array(b - a + 1).keys()].map((x) => x + a),
  contains: (x) => a <= x && x <= b,
  intersects: (x, y) => !(y < a || x > b),
  inc: (x) => (x >= b ? b : x + 1),
  dec: (x) => (x <= a ? a : x - 1),
  random: () => ol.randomInRange(a, b),
  randomInt: () => ol.randomIntInRange(a, b),
});

const array = (xs) => ({
  sum: () => ol.sum(xs),
  without: (x) => ol.without(xs, x),
  withoutIndex: (idx) => ol.withoutIndex(idx),
  initial: () => xs.slice(0, length - 1),
  head: () => [xs[0]],
  tail: () => xs.slice(1),
  rest: () => xs.slice(1),
  first: () => xs[0],
  last: () => xs[xs.length - 1],
  max: () => xs.reduce((a, x) => (x > a ? x : a)),
  min: () => xs.reduce((a, x) => (x < a ? x : a)),
  groupBy: (proj) => xs.reduce((a, v) => ol.add2obj(a, proj(v), v), {}),
  uniq: () => xs.reduce((a, x) => (a.includes(x) ? a : [...a, x]), []),
  unite: (ys) => array([...xs, ...ys]).uniq(),
  xor: (ys) => ([...xs, ...ys]).filter(x => !(xs.includes(x) && ys.includes(x))),
  intersect: (ys) => xs.filter((x) => ys.includes(x)),
  subtract: (ys) => xs.filter((x) => !ys.includes(x)),
  subsetOf: (ys) => ys.every((x) => xs.includes(x)),
  tap: (f) => (f(xs), xs),
  largerThan: (a) => xs.filter((x) => x > a),
  smallerThan: (a) => xs.filter((x) => x < a),
});

//state as natural enemy of one liners!
const memoize = (fn) => {
  let cache = {};
  return (x) => cache[x] || (cache[x] = fn(x));
};

const fib = memoize(ol.fib);

module.exports = { ol, num, interval, array };
