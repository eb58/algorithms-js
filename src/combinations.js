const range = require('./ol').ol.range;
const array = require('./ol').array;
const bitset = require('./ol').bitset;

/*
 (12345,3) -> 
 1 ++ (2345,2)
 2 ++ (345,2)
 3 ++ (45,2)
 */

// comb1 - fastest solution
comb1 = (xs, k, pred) => {
  const result = [];
  const res = [];

  const run = (level, start) => {
    const len = xs.length - k + level + 1;
    for (let i = start; i < len; i++) {
      res[level] = xs[i];
      if (level < k - 1) {
        run(level + 1, i + 1);
      } else {
        if (!pred || pred(res)) {
          result.push(res.slice());
        }
      }
    }
  };
  run(0, 0);
  return result;
};

// comb1a - similar to comb1
comb1a = (xs, k) => {
  const result = [];
  combX = (sofar, rest, k) => (k === 0 ? result.push(sofar) : range(rest.length).forEach((i) => combX([...sofar, rest[i]], rest.slice(i + 1), k - 1)));
  combX([], xs, k);
  return result;
};

// comb2 - Most elegant solution
comb2 = (xs, k) => !k
  ? [[]]
  : range(xs.length - k + 1).reduce((a, i) =>
    [...a, ...comb2(xs.slice(i + 1), k - 1).map((ys) => [xs[i], ...ys])],
    []);


{// combinations for Set
  slice = (S, n) => new Set([...S].slice(n))
  at = (S, i) => [...S][i]
  combS = (S, k) => !k
    ? [[]]
    : range(S.size - k + 1).reduce((a, i) => {
      return [...a, ...combS(slice(S, i + 1), k - 1).map((T) => new Set([...T, at(S, i)]))]
    }, []);
}

combBS = (S, k) => !k
  ? [[]]
  : range(bitset.size(S) - k + 1).reduce((a, i) => {
    return [...a, ...combBS(bitset.slice(S, i + 1), k - 1).map((T) => bitset.add(T, bitset.at(S, i)))]
  }, []);

// comb3 --- too slow  but quite interesting!!!
comb3a = (xs, k) => (k === 1 ? xs.map((x) => [x]) : comb3a(xs, k - 1).reduce((a, ys) => [...a, ...array(xs).largerThan(array(ys).max()).map((x) => [...ys, x])], []));

comb4 = (() => {
  const range = (n) => [...Array(n).keys()];
  const cache = {};
  return (comb4 = (xs, k) => {
    const len = xs.length;
    if (!cache[len]) {
      cache[len] = {};
    }
    if (!cache[len][k]) {
      cache[len][k] = comb1(range(len), k);
    }
    const mapping = xs.reduce((acc, x, i) => ((acc[i] = x), acc), {});
    return cache[len][k].map((ys) => ys.map((y) => mapping[y]));
  });
})();

module.exports = {
  comb1,
  comb1a,
  comb2,
  comb4,
};
