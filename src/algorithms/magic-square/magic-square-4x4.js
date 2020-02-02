module.exports = () => {

  const ol = require('../../ol/ol').ol;
  const num = require('../../ol/ol').num;
  const interval = require('../../ol/ol').interval;
  const array = require('../../ol/ol').array;

  const comb = require('../combinations')[0];
  const perm = require('../perm').perm4;
  const magicSquareUtils = require('./magic-square-utils');

  const N = 4;
  const utils = magicSquareUtils(N);
  const MN = utils.computeMagicNumber();
  let square = ol.rangeFilled(N * N, 0);
  let availableNumbers = ol.range(N * N).map(x => x + 1);

  const computeCombis = (square, availableNumbers, rowdef) =>
    rowdef ? comb(availableNumbers, rowdef.row.length)
            .filter(xs => rowdef.restriction(xs, square, availableNumbers))
            .map(xs => ({numbersArray: xs, perms: perm(xs)})) : [];

  const rowsDef = [
    /*  
     0  1  2  3
     4  5  6  7
     8  9 10 11
     12 13 14 15
     */
    {row: [0, 5, 10, 15], restriction: xs => xs.sum() === MN}, // diag1
    {row: [12, 9, 6, 3], restriction: xs => xs.sum() === MN}, // diag2
    {row: [1, 2],
      restriction: (xs, square, availableNumbers) => {
        if (square[0] + xs[0] + xs[1] + square[3] !== MN)
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[5] + square[9])) && !availableNumbers.includes(MN - (xs[1] + square[5] + square[9])))
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[6] + square[10])) && !availableNumbers.includes(MN - (xs[1] + square[6] + square[10])))
          return false;
        return true;
      }
    },
    {row: [4, 8], restriction: (xs, square, availableNumbers) => {
        if (xs.sum() !== MN - square[0] - square[12])
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[5] + square[6])) && !availableNumbers.includes(MN - (xs[1] + square[5] + square[6])))
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[9] + square[10])) && !availableNumbers.includes(MN - (xs[1] + square[9] + square[10])))
          return false;
        return true;
      }},
    {row: [13], restriction: (xs, square, availableNumbers) => xs[0] + square[1] + square[5] + square[9] === MN },
    {row: [14], restriction: (xs, square, availableNumbers) => xs[0] + square[2] + square[6] + square[10] === MN},
    {row: [7], restriction: (xs, square, availableNumbers) => xs[0] + square[4] + square[5] + square[6] === MN},
    {row: [11], restriction: (xs, square, availableNumbers) => xs[0] + square[8] + square[9] + square[10] === MN},
    //{row: [4], restriction: (xs, square, availableNumbers) => xs[0] + square[5] + square[6] + square[7] === MN},
    // {row: [8], restriction: (xs, square, availableNumbers) => xs[0] + square[9] + square[10] + square[11] === MN},
  ]
  console.log(availableNumbers, rowsDef, JSON.stringify(rowsDef));

  const res = [];

  const combineToMagicSquare = (square, availableNumbers, i) => {

    if (availableNumbers.length === 0 && utils.isMagic(square)) {
      res.push(square);
      return;
    }

    const combis = computeCombis(square, availableNumbers, rowsDef[i]);
    // console.log(availableNumbers, JSON.stringify(combis));
    combis.forEach(combi => {
      const lAvailableNumbers = availableNumbers.subtract(combi.numbersArray)
      combi.perms.forEach(perm => {
        utils.setRow(square, rowsDef[i].row, perm);
        // utils.dump('>>>>>>>>>>>>>>>>>>>>>', square);
        combineToMagicSquare([...square], lAvailableNumbers, i + 1)
      })
    })
  }
  combineToMagicSquare(square, availableNumbers, 0);
  // console.log("RES", res.length, res);
  return res;
}