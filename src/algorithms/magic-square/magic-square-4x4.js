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
  const computeAvailable2Sums = availableNumbers => Array.from(new Set(comb(availableNumbers, 2).map(x => x[0] + x[1])));
  const computeCombis = (square, availableNumbers, rowdef) => rowdef
            ? comb(availableNumbers, rowdef.row.length)
            .filter(xs => rowdef.restriction(xs, square, availableNumbers))
            .map(xs => ({xs, perms: perm(xs)}))
            : [];

  const numberOneIsNotInFirstQuad = square => [2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].some(x => square[x] === 1);
  const rowsDef = [
    /*  
     0  1  2  3
     4  5  6  7
     8  9 10 11
     12 13 14 15
     */
    {row: [0, 5, 10, 15], restriction: xs => xs.sum() === MN}, // diag1
    {row: [12, 9, 6, 3], restriction: xs => xs.sum() === MN}, // diag2
    {row: [1, 2], restriction: (xs, square, availableNumbers) => {
        if (square[0] + xs[0] + xs[1] + square[3] !== MN)
          return false;
        const x59 = MN - square[5] - square[9]
        if (!availableNumbers.without(x[1]).includes(x59 - xs[0]) && !availableNumbers.without(x[0]).includes(x59 - xs[1]))
          return false;
        const x610 = MN - square[6] - square[10]
        if (!availableNumbers.without(x[1]).includes(x610 - xs[0]) && !availableNumbers.without(x[0]).includes(x610 - xs[1]))
          return false;
        return true
        // console.log( 'AAAA', availableNumbers )
        const len = availableNumbers.length
        const min2sum = availableNumbers[0] + availableNumbers[1];
        const max2sum = availableNumbers[len - 1] + availableNumbers[len - 2];
        return true &&
                min2sum + square[0] + square[3] <= MN &&
                min2sum + square[5] + square[6] <= MN &&
                min2sum + square[9] + square[10] <= MN &&
                min2sum + square[12] + square[15] <= MN &&
                min2sum + square[0] + square[12] <= MN &&
                min2sum + square[3] + square[15] <= MN &&
                max2sum + square[0] + square[3] >= MN &&
                max2sum + square[5] + square[6] >= MN &&
                max2sum + square[9] + square[10] >= MN &&
                max2sum + square[12] + square[15] >= MN &&
                max2sum + square[0] + square[12] >= MN &&
                max2sum + square[3] + square[15] >= MN

      }
    },
    {row: [4, 8], restriction: (xs, square, availableNumbers) => {
        const len = availableNumbers.length

        if (xs[0] + xs[1] + square[0] + square[12] !== MN)
          return false;

        if (!availableNumbers.includes(MN - (square[1] + square[5] + square[9])))
          return false;
        if (!availableNumbers.includes(MN - (square[2] + square[6] + square[10])))
          return false;

        if (square[1] + square[5] + square[9] + availableNumbers[0] > MN)
          return false;
        if (square[2] + square[6] + square[10] + availableNumbers[0] > MN)
          return false;

        if (square[1] + square[5] + square[9] + availableNumbers[len - 1] < MN)
          return false;
        if (square[2] + square[6] + square[10] + availableNumbers[len - 1] < MN)
          return false;

        if (!availableNumbers.includes(MN - (xs[0] + square[5] + square[6])) && !availableNumbers.includes(MN - (xs[1] + square[5] + square[6])))
          return false;
        if (!availableNumbers.includes(MN - (xs[0] + square[9] + square[10])) && !availableNumbers.includes(MN - (xs[1] + square[9] + square[10])))
          return false;
        return true;
      }},
    {row: [13], restriction: (xs, square, availableNumbers) => xs[0] + square[1] + square[5] + square[9] === MN},
    {row: [14], restriction: (xs, square, availableNumbers) => xs[0] + square[2] + square[6] + square[10] === MN},
    {row: [7], restriction: (xs, square, availableNumbers) => xs[0] + square[4] + square[5] + square[6] === MN},
    {row: [11], restriction: (xs, square, availableNumbers) => xs[0] + square[8] + square[9] + square[10] === MN},
            //{row: [4], restriction: (xs, square, availableNumbers) => xs[0] + square[5] + square[6] + square[7] === MN},
            // {row: [8], restriction: (xs, square, availableNumbers) => xs[0] + square[9] + square[10] + square[11] === MN},
  ]

  const setRow = (square, row, perm) => {
    row.forEach((x, idx) => {
      square[x] = perm[idx]
    });
    return row.map((x, idx) => x < 0 ? x : perm[idx]);
  }
  const res = [];
  const combineToMagicSquare = (square, availableNumbers, i) => {

    if (numberOneIsNotInFirstQuad(square)) {
      return;
    }

    if (availableNumbers.length === 0 && utils.isMagic(square)) {
      res.push(square);
      return;
    }

    const combis = computeCombis(square, availableNumbers, rowsDef[i]);
 
    if (i === 41 && combis.length) {
      console.log('i:', i, 'combis#:', combis.length, 'available:', availableNumbers.join(' '), '2sums:', computeAvailable2Sums(availableNumbers).sort().join(' '));
      utils.dump('aaa', square);//, JSON.stringify(x, 0, 3));
    }

    // console.log(availableNumbers, JSON.stringify(combis));
    combis.forEach(combi => {
      const newAvailableNumbers = availableNumbers.subtract(combi.xs)
      combi.perms.forEach(perm => {
        setRow(square, rowsDef[i].row, perm);
        combineToMagicSquare([...square], newAvailableNumbers, i + 1)
      })
    })
  }

  const square = ol.rangeFilled(N * N, 0);
  const availableNumbers = ol.range(N * N).map(x => x + 1);

  const x = computeCombis(square, availableNumbers, rowsDef[0]);
  console.log(x.length, '#', availableNumbers.join(' '));//, JSON.stringify(x, 0, 3));

  combineToMagicSquare(square, availableNumbers, 0);
  return res;
}
