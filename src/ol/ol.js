const ol = {
  id: x => x,
  abs: x => x >= 0 ? x : -x,
  sqr: x => x * x,
  cube: x => x * x * x,
  fac: x => ol.range(x).reduce((acc, n) => acc * (n + 1), 1),
  fib: x => x <= 2 ? 1 : ol.fib(x - 1) + ol.fib(x - 2),
  randomInRange: (min, max) => Math.random() * (max - min) + min,
  randomInRangeInt: (min, max) => Math.floor(ol.randomInRange(min, max + 1)),

  // predicates
  odd: x => x % 2 !== 0,
  even: x => x % 2 === 0,
  ininterval: (x, a, b) => a <= x && x <= b,
  leapyear: x => x % 4 === 0 && x % 100 !== 0 || x % 400 === 0,

  // cmp
  cmp: (x, y) => (x === y) ? 0 : x < y ? -1 : +1,

  // arrays
  range: n => [...Array(n).keys()],
  rangeFilled: (n, val) => [...Array(n).keys()].map(() => val),
  randomArray: (n, min, max) => ol.range(n).map(() => ol.randomInRange(min, max)),
  randomIntArray: (n, min, max) => ol.range(n).map(() => ol.randomInRangeInt(min, max)),
  sum: xs => xs.reduce((acc, x) => acc + x, 0),
  without: (xs, x) => xs.filter(y => x !== y),
  withoutIndex: (xs, idx) => xs.filter((_, i) => i !== idx),
  random: (n, min, max) => ol.range(n).map(() => ol.randomInRange(min, max)),

  // 
  add2Arr: (a, v) => a ? [...a, v] : [v],
  add2ObjArr: (o, key, val) => (o[key] = o[key] ? [...o[key], val] : [v], o),
};

// Wrappers
const num = x => {
  const api = {
    id: () => ol.id(x),
    abs: () => ol.abs(x),
    sqr: () => ol.sqr(x),
    cube: () => ol.cube(x),
    ininterval: (a, b) => ol.ininterval(x, a, b),
  };
  return api;
};

const interval = (a, b) => {
  return {
    array: () => [...Array(b - a + 1).keys()].map(x => x + a),
    contains: x => a <= x && x <= b,
    intersects: (x, y) => !(x < a || y > b),
    inc: x => x === b ? x : x + 1,
    dec: x => x === a ? x : x - 1,
    random: () => Math.random() * (b - a + 1) + a,
    randomInt: () => Math.floor(Math.random() * (b - a + 1) + a),
  };
};

const array = xs => {
  const api = {
    sum: () => ol.sum(xs),
    without: x => ol.without(x),
    withoutIndex: idx => ol.withoutIndex(idx),
    head: () => [xs[0]],
    tail: () => xs.slice(1),
    intersect: ys => {
    }, // TODO!!!!
    unite: ys => {
    }, // TODO!!!!
    groupByA: projection => xs.reduce((a, n) => {
        const p = projection(n);
        a[p] = a[p] ? [...a[p], n] : [n];
        return a;
      }, {}),
    groupByB: projection => xs.reduce((a, n) => {
        const f = v => (a[v] = ol.add2Arr(a[v], n), a);
        return f(projection(n))
      }, {}),
    groupByC: proj => xs.reduce((a, n) => (v => (a[v] = ol.add2Arr(a[v], n), a))(proj(n)), {}), // auch nett!!!
    groupBy: proj => xs.reduce((obj, val) => (key => ol.add2ObjArr(obj, key, val))(proj(n)), {}), // auch nett!!!
  }
  return api;
}


//state as natural enemy of one liners!
const memoize = fn => {
  let cache = {};
  return x => cache.x || (cache[x] = fn(x));
};

f = memoize(ol.fib);

module.exports = {ol, num, interval, array}
