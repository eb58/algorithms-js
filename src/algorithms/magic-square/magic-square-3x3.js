module.exports = () => {

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
  let square = ol.rangeFilled(N * N, 0);
  let availableNumbers = ol.range(N * N).map(x => x + 1);

  const computeCombis = (square, availableNumbers, rowdef) =>
    rowdef ? comb(availableNumbers, rowdef.row.length)
            .filter(xs => rowdef.restriction(xs, square))
            .map(xs => ({numbersArray: xs, perms: perm(xs)})) : [];

  const rowsDef = [
    /*   
     0  1  2  
     3  4  5
     6  7  8
     */
    {row: [0, 4, 8], restriction: (xs) => xs.sum() === MN}, // diag
    {row: [1, 2], restriction: (xs, square) => xs.sum() === MN - square[0]},
    {row: [5], restriction: (xs, square) => xs.sum() === MN - square[2] - square[8]},
    {row: [7], restriction: (xs, square) => xs.sum() === MN - square[1] - square[4]},
    {row: [6], restriction: (xs, square) => xs.sum() === MN - square[7] - square[8]},
    {row: [3], restriction: (xs, square) => xs.sum() === MN - square[0] - square[6]},
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