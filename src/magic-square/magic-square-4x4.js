Array.prototype.subtract = function (xs) { return this.filter(x => !xs.includes(x)); }

module.exports = () => {
  const range = require('../ol').ol.range;
  const bitset = require('../ol').bitset;
  const combBS = require('../combinations').combBS;
  const perm = require('../perm').perm4;

  const N = 4;
  const RANGE16 = range(N * N).map((x) => x + 1);
  const MN = RANGE16.reduce((acc, x) => acc + x, 0) / N;
  const square = range(N * N).map(() => 0);
  const availableNumbers = bitset.fromArray(RANGE16);

  const setRow = (square, row, perm) => row.forEach((x, idx) => (square[x] = perm[idx]));
  const numberOneIsNotInUpperLeft = (() => {
    const idxNotForNumberOne = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    return (xs) => idxNotForNumberOne.some((x) => xs[x] === 1);
  })();

  const chk = (avn, s1, s2) => s1 != s2 && bitset.includes(avn, MN - s1) && bitset.includes(avn, MN - s2);
  const check = (xs, sq, avn, x1, x2, y1, y2) => chk(avn, xs[0] + sq[x1] + sq[x2], xs[1] + sq[y1] + sq[y2]) || chk(avn, xs[1] + sq[x1] + sq[x2], xs[0] + sq[y1] + sq[y2]);

  const rowsDef = [
    { row: [0, 5, 10, 15], restriction: (xs) => xs[0] + xs[1] + xs[2] + xs[3] === MN }, // diag1
    { row: [12, 9, 6, 3], restriction: (xs) => xs[0] + xs[1] + xs[2] + xs[3] === MN }, // diag2
    { row: [1, 2], restriction: (xs, sq, avn) => sq[0] + xs[0] + xs[1] + sq[3] === MN && check(xs, sq, avn, 5, 9, 6, 10) },
    { row: [4, 8], restriction: (xs, sq, avn) => sq[0] + xs[0] + xs[1] + sq[12] === MN && check(xs, sq, avn, 5, 6, 9, 10) },
    { row: [7], restriction: (xs, sq) => xs[0] + sq[4] + sq[5] + sq[6] === MN },
    { row: [11], restriction: (xs, sq) => xs[0] + sq[8] + sq[9] + sq[10] === MN },
    { row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN },
    { row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN },
  ];

  const combineToMagicSquare = (square, availableNumbers, i) => {
    if (numberOneIsNotInUpperLeft(square)) {
      return;
    }

    if (bitset.isEmpty(availableNumbers)) {
      res.push(square);
      return;
    }

    const rowDef = rowsDef[i];
    combBS(availableNumbers, rowDef.row.length)
      .filter(xs => rowDef.restriction(bitset.toArray(xs), square, availableNumbers))
      // .map(xs => (i==0 &&  console.log(i, bitset.toArray(xs)), xs))
      .forEach((combi) => {
        const newAvailableNumbers = bitset.diff(availableNumbers, combi);
        perm(bitset.toArray(combi)).forEach((p) => {
          setRow(square, rowDef.row, p);
          combineToMagicSquare([...square], newAvailableNumbers, i + 1);
        });
      });
  };
  const res = [];
  combineToMagicSquare(square, availableNumbers, 0);
  return res;
};