const range = n => [...Array(n).keys()];

const comb1 = (xs, k) => {
  const r = [];
  const res = [];

  const run = (level, start) => {
    for (let i = start, len = xs.length - k + level + 1; i < len; i++) {
      res[level] = xs[i];

      if (level < k - 1) {
        run(level + 1, i + 1);
      } else {
        r.push(res.slice());
      }
    }
  };
  run(0, 0);
  return r;
};


/*
 comb( [1,2,3,4], 0 ) ->  [ ]
 comb( [1,2,3,4], 1 ) ->  [ [1], [2], [3], [4] ]
 comb( [1,2,3,4], 2 ) ->  [ [1,2], [1,3], [1,4], [2,3], [2,4], [3,4] ]
 comb( [1,2,3,4], 3 ) ->  [ [1,2,3], [1,2,4], [1,3,4], [2,3,4] ]
 comb( [1,2,3,4], 4 ) ->  [ [1,2,3,4] ]
 
 c( [1,2,3,4], 2 ) ->
 c([2,3,4],1).map(ys => [1,...ys]
 c([3,4],1).map(ys => [2,...ys]
 c([4],1).map(ys => [3,...ys]
 
 c( [1,2,3,4,5], 2 ) ->
 c([2,3,4,5],1).map(ys => [1,...ys]
 c([3,4,5],1).map(ys => [2,...ys]
 c([4,5],1).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 
 c( [1,2,3,4,5], 3 ) ->
 c([2,3,4,5],2).map(ys => [1,...ys]
 c([3,4,5],1).map(ys => [2,...ys]
 c([4,5],1).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 c([3,4,5],2).map(ys => [2,...ys]
 c([4,5],1).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 c([4,5],2).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 */
tails = (xs, k) => range(xs.length - k + 1).map(i => ({head: xs[i], tail: xs.slice(i + 1)}));
comb2 = (xs, k) => !k ? [[]] : tails(xs, k).reduce((a, ys) => [...a, ...comb2(ys.tail, k - 1).map(zs => [ys.head, ...zs])], []);

// comb3a only for ordered sets:  x= [1,2,3,4,5] 
/* comb([1,2,3,4,5],k) ->
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

max = xs => xs.reduce((a, x) => x > a ? x : a, 0);
largerThan = (xs, a) => xs.filter(x => x > a);
comb3a = (xs, k) => k === 1 ? xs.map(x=>[x]) : comb3a(xs, k - 1).reduce((a, ys) => [...a, ...largerThan(xs, max(ys)).map(x => [...ys, x])], []);
comb3 = (xs, k) => comb3a(xs.map((x, i) => i), k).map(ys => ys.map((y) => xs[y]))

comb4 = (xs, k) => { 
  const result = [];
  combX = (sofar, rest, k) => k === 0 ? result.push(sofar) : range(rest.length).forEach(i => combX([...sofar, rest[i]], rest.slice(i + 1), k - 1));
  combX([], xs, k);
  return result;
}
/* Haskell
 combinations :: Int -> [a] -> [[a]]
 combinations 0 _ = [[]]
 combinations _ [] = []
 combinations n (x:xs) = (map (x:) (combinations (n-1) xs)) ++ (combinations n xs)
 */


module.exports = {
  comb1,
  comb2,
  comb3,
  comb4,
};