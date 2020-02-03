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
  const computeAvailable2Sums = availableNumbers => array(comb(availableNumbers, 2).map(x => x[0] + x[1]).sort((x,y)=>x-y)).uniq();

  const computeCombis = (square, availableNumbers, rowdef) => rowdef
            ? comb(availableNumbers, rowdef.row.length)
            .filter(xs => rowdef.restriction(square, xs, availableNumbers))
            .map(xs => ({
                perms: perm(xs),
                numbersArray: xs,
                available2Sums: computeAvailable2Sums(xs),
              }))
            : [];

  const numberOneIsNotInFirstQuad = (square) =>
    [7, 10, 11, 13, 14, 15].some(x => square[x] === 1)
  // || [8, 9, 10, 11, 12, 13, 14, 15].some(x => square[x] === 1);

  const rowsDef = [
    /*  
     0  1  2  3
     4  5  6  7
     8  9 10 11
     12 13 14 15
     */
    {row: [0, 5, 10, 15], restriction:( square, xs ) => xs.sum() === MN}, // diag1
    {row: [12, 9, 6, 3], restriction: ( square, xs ) => {
        if (xs.sum() !== MN)
          return false;
        // if( )
        return true;
      }}, // diag2
    {row: [1, 2],
      restriction: ( square, xs, availableNumbers) => {
        if (square[0] + xs[0] + xs[1] + square[3] !== MN)
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[5] + square[9])) && !availableNumbers.includes(MN - (xs[1] + square[5] + square[9])))
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[6] + square[10])) && !availableNumbers.includes(MN - (xs[1] + square[6] + square[10])))
          return false;
        return true;
      }
    },
    {row: [4, 8], restriction: (square, xs, availableNumbers) => {
        if (xs.sum() !== MN - square[0] - square[12])
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[5] + square[6])) && !availableNumbers.includes(MN - (xs[1] + square[5] + square[6])))
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[9] + square[10])) && !availableNumbers.includes(MN - (xs[1] + square[9] + square[10])))
          return false;
        return true;
      }},
    {row: [13], restriction: ( square, xs, availableNumbers) => xs[0] + square[1] + square[5] + square[9] === MN},
    {row: [14], restriction: ( square, xs, availableNumbers) => xs[0] + square[2] + square[6] + square[10] === MN},
    {row: [7], restriction: ( square, xs, availableNumbers) => xs[0] + square[4] + square[5] + square[6] === MN},
    {row: [11], restriction: ( square, xs, availableNumbers) => xs[0] + square[8] + square[9] + square[10] === MN},
  ]

  console.log(availableNumbers, computeAvailable2Sums, rowsDef, JSON.stringify(rowsDef), computeCombis(square, rowsDef[0]));

  const res = [];

  const combineToMagicSquare = (square, availableNumbers, available2Sums, i) => {

    if (availableNumbers.length === 0 && utils.isMagic(square)) {
      res.push(square);
      return;
    }

    // if (numberOneIsNotInFirstQuad(square)) { console.log('AAA', k++);      return;    }

    const combis = computeCombis(square, availableNumbers, rowsDef[i]);
    // console.log(availableNumbers, JSON.stringify(combis));
    combis.forEach(combi => {
      combi.perms.forEach(perm => {
        utils.setRow(square, rowsDef[i].row, perm);
        combineToMagicSquare(
          [...square], 
          availableNumbers.subtract(combi.numbersArray),
          combi.available2Sums, 
          i + 1)
      })
    })
  }


  const square = ol.rangeFilled(N * N, 0);
  const availableNumbers = ol.range(N * N).map(x => x + 1);
  const available2Sums = computeAvailable2Sums(availableNumbers);
  
  combineToMagicSquare(square, availableNumbers, available2Sums, 0);
  // console.log("RES", res.length, res);
  return res;
}




