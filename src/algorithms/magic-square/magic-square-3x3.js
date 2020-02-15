module.exports = () => {
  /*   
   0  1  2  
   3  4  5
   6  7  8
   */
  const ol = require('../../ol/ol').ol;
  const num = require('../../ol/ol').num;
  const interval = require('../../ol/ol').interval;
  const array = require('../../ol/ol').array;

  const comb = require('../combinations')[0];
  const perm = require('../perm').perm4;
  const magicSquareUtils = require('./magic-square-utils');

  const N = 3;
  const utils = magicSquareUtils(N);
  const MN = utils.computeMagicNumber();
  const idxNotForNumberOne = [2, 3, 4, 5, 6, 7, 8, 9];

  const setRow = (square, row, perm) => row.forEach((x, idx) => square[x] = perm[idx]);
  const numberOneIsNotInUpperLeft = xs => idxNotForNumberOne.some(x => xs[x] === 1);

  const rowsDef = [
    {row: [0, 4, 8], restriction: (xs) => xs.sum() === MN}, // diag
    {row: [1, 2], restriction: (xs, square) => xs.sum() === MN - square[0]},
    {row: [5], restriction: (xs, square) => xs.sum() === MN - square[2] - square[8]},
    {row: [7], restriction: (xs, square) => xs.sum() === MN - square[1] - square[4]},
    {row: [6], restriction: (xs, square) => xs.sum() === MN - square[7] - square[8]},
    {row: [3], restriction: (xs, square) => xs.sum() === MN - square[0] - square[6]},
  ]
  //console.log(availableNumbers, rowsDef, JSON.stringify(rowsDef));

  const combineToMagicSquare = (square, availableNumbers, i) => {
    if (numberOneIsNotInUpperLeft(square)) {
      return;
    }

    if (availableNumbers.length === 0) {
      res.push(square);
      return;
    }

    const rowDef = rowsDef[i];
    const combis = comb(availableNumbers, rowDef.row.length)
            .filter(xs => rowDef.restriction(xs, square, availableNumbers))

    combis.forEach(combi => {
      const newAvailableNumbers = availableNumbers.subtract(combi)
      perm(combi).forEach(p => {
        setRow(square, rowDef.row, p);
        combineToMagicSquare([...square], newAvailableNumbers, i + 1)
      })
    })
  }

  const square = ol.rangeFilled(N * N, 0);
  const availableNumbers = ol.range(N * N).map(x => x + 1);
  const res = [];
  combineToMagicSquare(square, availableNumbers, 0);
  return res;
}