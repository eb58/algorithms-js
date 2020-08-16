module.exports = () => {
  const magicSquareUtils = require('./magic-square-utils');
  const comb = require('../combinations').comb1;
  const perm = require('../perm').perm4;
  const range = require('../ol').ol.range;

  const N = 4;
  const square = range(N * N).map(() => 0);
  const availableNumbers = range(N * N).map((x) => x + 1);
  const MN = availableNumbers.reduce((acc, x) => acc + x, 0) / N;
  const idxNotForNumberOne = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const setRow = (square, row, perm) => row.forEach((x, idx) => (square[x] = perm[idx]));
  const numberOneIsNotInUpperLeft = (xs) => idxNotForNumberOne.some((x) => xs[x] === 1);

  const chk = (avn, s1, s2) => s1 != s2 && avn.includes(MN - s1) && avn.includes(MN - s2);
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