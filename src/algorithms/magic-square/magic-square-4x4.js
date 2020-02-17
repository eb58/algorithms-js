module.exports = () => {
  const ol = require("../../ol/ol").ol;
  const comb = require("../combinations")[0];
  const perm = require("../perm").perm4;
  const magicSquareUtils = require("./magic-square-utils");

  const N = 4;
  const utils = magicSquareUtils(N);
  const MN = utils.computeMagicNumber();
  const idxNotForNumberOne = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const setRow = (square, row, perm) => row.forEach((x, idx) => (square[x] = perm[idx]));
  const numberOneIsNotInUpperLeft = xs => idxNotForNumberOne.some(x => xs[x] === 1);
  const checkPair = (xs, sq, avn, x, y) => avn.includes(MN - xs[0] - sq[x] - sq[y]) || avn.includes(MN - xs[1] - sq[x] - sq[y]);

  const check = {
    avn2: (xs, sq, availableNumbers) => checkPair(xs, sq, availableNumbers, 5, 9) && checkPair(xs, sq, availableNumbers, 6, 10),
    avn3: (xs, sq, availableNumbers) => checkPair(xs, sq, availableNumbers, 5, 6) && checkPair(xs, sq, availableNumbers, 9, 10)
  };

  const rowsDef = [
    { row: [0, 5, 10, 15], restriction: xs => xs.sum() === MN }, // diag1
    { row: [12, 9, 6, 3], restriction: xs => xs.sum() === MN }, // diag2
    { row: [1, 2], restriction: (xs, sq, availableNumbers) => sq[0] + xs[0] + xs[1] + sq[3] === MN && check.avn2(xs, sq, availableNumbers) },
    { row: [4, 8], restriction: (xs, sq, availableNumbers) => sq[0] + xs[0] + xs[1] + sq[12] === MN && check.avn3(xs, sq, availableNumbers) },
    { row: [7], restriction: (xs, sq) => xs[0] + sq[4] + sq[5] + sq[6] === MN },
    { row: [11], restriction: (xs, sq) => xs[0] + sq[8] + sq[9] + sq[10] === MN },
    { row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN },
    { row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN }
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
    const predicate = (square, availableNumbers, rowDef) => xs => rowDef.restriction(xs, square, availableNumbers);
    const combis = comb(availableNumbers, rowDef.row.length, predicate(square, availableNumbers, rowDef));

    combis.forEach(combi => {
      const newAvailableNumbers = availableNumbers.subtract(combi);
      perm(combi).forEach(p => {
        setRow(square, rowDef.row, p);
        combineToMagicSquare([...square], newAvailableNumbers, i + 1);
      });
    });
  };

  const square = ol.rangeFilled(N * N, 0);
  const availableNumbers = ol.range(N * N).map(x => x + 1);
  const res = []; 
  combineToMagicSquare(square, availableNumbers, 0);
  return res;
};