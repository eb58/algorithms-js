Array.prototype.subtract = function(xs){ return this.filter(x => !xs.includes(x)); }

module.exports = () => {
  const comb = require('../combinations').comb1;
  const perm = require('../perm').perm4;
  const range = require('../ol').ol.range;
  const sum = require('../ol').ol.sum;

  const N = 3;
  const square = range(N * N).map(() => 0);
  const availableNumbers = range(N * N).map((x) => x + 1);
  const MN = availableNumbers.reduce((acc, x) => acc + x, 0) / N;
  const idxNotForNumberOne = [2, 3, 4, 5, 6, 7, 8, 9];

  const numberOneIsNotInUpperLeft = (xs) => idxNotForNumberOne.some((x) => xs[x] === 1);
  const setRow = (square, row, perm) => row.forEach((x, idx) => (square[x] = perm[idx]));

  const rowsDef = [
    { row: [0, 4, 8], restriction: (xs) => sum(xs) === MN }, // diag
    { row: [1, 2], restriction: (xs, sq) => sum(xs) === MN - sq[0] },
    { row: [5], restriction: (xs, sq) => sum(xs) === MN - sq[2] - sq[8] },
    { row: [7], restriction: (xs, sq) => sum(xs) === MN - sq[1] - sq[4] },
    { row: [6], restriction: (xs, sq) => sum(xs) === MN - sq[7] - sq[8] },
    { row: [3], restriction: (xs, sq) => sum(xs) === MN - sq[0] - sq[6] },
  ];

  const combineToMagicSquare = (square, availableNumbers, i) => {
    if (numberOneIsNotInUpperLeft(square)) {
      return;
    }

    if (availableNumbers.length === 0) {
      res.push(square);
      return;
    }

    const rowDef = rowsDef[i];
    const predicate = (xs) => rowDef.restriction(xs, square, availableNumbers);
    comb(availableNumbers, rowDef.row.length, predicate).forEach((combi) => {
      const newAvailableNumbers = availableNumbers.subtract(combi);
      perm(combi).forEach((p) => {
        setRow(square, rowDef.row, p);
        combineToMagicSquare([...square], newAvailableNumbers, i + 1);
      });
    });
  };

  const res = [];
  combineToMagicSquare(square, availableNumbers, 0);
  return res;
};