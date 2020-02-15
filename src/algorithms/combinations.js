const range = n => [...Array(n).keys()];

/*
 (12345,3) ->
 1 ++ (2345,2)
 2 ++ (345,2)
 3 ++ (45,2)
 */


// comb1 - fastest solution
const comb1 = (xs, k, pred) => {
  const result = [];
  const res = [];

  const run = (level, start) => {
    for (let i = start, len = xs.length - k + level + 1; i < len; i++) {
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
  combX = (sofar, rest, k) => k === 0 ? result.push(sofar) : range(rest.length).forEach(i => combX([...sofar, rest[i]], rest.slice(i + 1), k - 1));
  combX([], xs, k);
  return result;
}

// comb2 - Most elegant solution
comb2 = (xs, k) => !k ? [[]] : range(xs.length - k + 1).reduce((a, i) => [...a, ...comb2(xs.slice(i + 1), k - 1).map(ys => [xs[i], ...ys])], [])

/*
 2  3    4
 12 123  1234
 13 124  1235
 14 125  1245
 15 134  1345
 23 135  2345
 24 145
 25 234
 34 235
 35 245
 45 345
 */
// comb3 --- too slow  but quite interesting!!!
max = xs => xs.reduce((a, x) => x > a ? x : a, 0);
largerThan = (xs, a) => xs.filter(x => x > a);
comb3a = (xs, k) => k === 1 ? xs.map(x => [x]) : comb3a(xs, k - 1).reduce((a, ys) => [...a, ...largerThan(xs, max(ys)).map(x => [...ys, x])], []);
comb3 = (xs, k) => comb3(xs.map((x, i) => i), k).map(ys => ys.map((y) => xs[y]))

/* Haskell
 comb :: Int -> [a] -> [[a]]
 comb 0 _ = [[]]
 comb _ [] = []
 comb n (x:xs) = (map (x:) (comb (n-1) xs)) ++ (comb n xs)
 */

module.exports = [
  comb1,
  comb1a,
  comb2,
];