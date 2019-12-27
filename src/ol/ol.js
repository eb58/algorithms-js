const ol = {
  sqr: x => x * x,
  cub: x => x * x * x,
  abs: x => x >= 0 ? x : -x,
  fac: x => ol.range(x).reduce((acc, n) => acc * (n + 1), 1),
  fib: x => x <= 2 ? 1 : ol.fib(x - 1) + ol.fib(x - 2),
  randomInRange: (min, max) => Math.random() * (max - min) + min,
  randomInRangeInt: (min, max) => Math.floor(ol.randomInRange(min, max + 1)),

  // pred
  odd: x => x % 2 !== 0,
  even: x => x % 2 === 0,
  inrange: (x, a, b) => a <= x && x <= b,

  // cmp
  cmp: (x, y) => (x === y) ? 0 : x < y ? -1 : +1,

  // date
  leapyear: x => x % 4 === 0 && x % 100 !== 0 || x % 400 === 0,

  // arrays
  range: n => [...Array(n).keys()],
  sum: xs => xs.reduce((acc, x) => acc + x, 0),
  without: (xs, x) => xs.filter(y => x !== y),
  withoutIndex: (xs, idx) => xs.filter((_, i) => i !== idx)
};

// Wrappers

const num = x => {
  const api = {
    sqr: () => x * x,
    cube: () => x * x * x,
    abs: () => x >= 0 ? x : -x,
    inrange: (a, b) => a <= x && x <= b,
  };
  return api;
};

const range = (a, b) => {
  return {
    array: () => [...Array(b - a + 1).keys()].map(x => x + a),
    contains: x => a <= x && x <= b,
    intersects: (x, y) => a <= x && x <= b || a <= y && y <= b,
    inc: x => x === b ? x : x + 1,
    dec: x => x === a ? x : x - 1,
    random: () => Math.random() * (b - a + 1) + a,
    randomInt: () => Math.floor(Math.random() * (b - a + 1) + a),
  };
};

const arrayGenerators = {
  range: n => ol.range(n),
  random: (n, min, max) => ol.range(n).map(() => ol.randomInRange(min, max))
}

const array = xs => {
  const api = {
    fill: x => xs => map(() => x),
    random: (a, b) => range(b ? a : 0, b ? b : 0).random(), // array().random(a,b) 
    randomInt: (a, b) => range(b ? a : 0, b ? b : 0).random(), // array().random(a,b) 
    sum: () => xs.reduce((acc, x) => acc + x, 0),
    without: x => xs.filter(y => x !== y),
    withoutIndex: idx => xs.filter((_, i) => i !== idx),
    head: () => [xs[0]],
    tail: () => xs.slice(1),
    intersect: ys => {
    }, // TODO!!!!
    unite: ys => {
    }, // TODO!!!!
    groupBy: proj => xs.reduce((a, n) => {
        const p = proj(n);
        a[p] = a[p] ? [...a[p], n] : [n];
        return a;
      }, {}),
    groupByA: proj => xs.reduce((a, n) => ((p => ((a[p] = a[p] ? [...a[p], n] : [n]), a)))(proj(n)), {}), // auch nett!!!
  }
  return api;
}


//state as natural enemy of one liners!
const memoize = fn => {
  let cache = {};
  return x => cache.x || (cache[x] = fn(x));
};

f = memoize(ol.fib);

module.exports = { ol, num }
