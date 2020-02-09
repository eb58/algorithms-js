module.exports = () => {
  /*  
   0  1  2  3
   4  5  6  7
   8  9 10 11
   12 13 14 15
   */
  const ol = require('../../ol/ol').ol;
  const comb = require('../combinations')[0];
  const perm = require('../perm').perm4;
  const magicSquareUtils = require('./magic-square-utils');

  const N = 4;
  const utils = magicSquareUtils(N);
  const MN = utils.computeMagicNumber();
  const idxNotForNumberOne = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const computeAvailable2Sums = availableNumbers => comb(availableNumbers, 2).map(x => x[0] + x[1]);
  const setRow = (square, row, perm) => row.forEach((x, idx) => square[x] = perm[idx]);
  const numberOneIsNotInUpperLeft = xs => idxNotForNumberOne.some(x => xs[x] === 1);

  const rowsDef = [
    {row: [0, 5, 10, 15], restriction: xs => xs.sum() === MN}, // diag1
    {row: [12, 9, 6, 3], restriction: xs => xs.sum() === MN}, // diag2
    {row: [1, 2],
      restriction: (xs, sq, availableNumbers) => {
        if (sq[0] + xs[0] + xs[1] + sq[3] !== MN)
          return false;

        const x59 = MN - sq[5] - sq[9]
        if (!availableNumbers.without(xs[1]).includes(x59 - xs[0]) && !availableNumbers.without(xs[0]).includes(x59 - xs[1]))
          return false;
        const x610 = MN - sq[6] - sq[10]
        if (!availableNumbers.without(xs[1]).includes(x610 - xs[0]) && !availableNumbers.without(xs[0]).includes(x610 - xs[1]))
          return false;

        return true;
      }
    },
    {row: [4, 8],
      restriction: (xs, sq, availableNumbers) => {
        if (sq[0] + xs[0] + xs[1] + sq[12] !== MN)
          return false;

        const x56 = MN - sq[5] - sq[6]
        if (!availableNumbers.without(xs[1]).includes(x56 - xs[0]) && !availableNumbers.without(xs[0]).includes(x56 - xs[1]))
          return false;

        const x910 = MN - sq[9] - sq[10]
        if (!availableNumbers.without(xs[1]).includes(x910 - xs[0]) && !availableNumbers.without(xs[0]).includes(x910 - xs[1]))
          return false; 
        
        return true;
      }},
    {row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN},
    {row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN},
    {row: [7], restriction: (xs, sq) => xs[0] + sq[4] + sq[5] + sq[6] === MN},
    {row: [11], restriction: (xs, sq) => xs[0] + sq[8] + sq[9] + sq[10] === MN},
  ]

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

    if (i === 200 && combis.length > 0) {
      console.log('i:', i, 'combis#:', combis.length, combis, 'available:', availableNumbers.join(' '), 'available2sums:', computeAvailable2Sums(availableNumbers).sort().join(' '));
      utils.dump('aaa', square);//, JSON.stringify(x, 0, 3));
    }

    combis.forEach(combi => {
      const newAvailableNumbers = availableNumbers.subtract(combi) 
      perm(combi).forEach(p => {
        setRow(square, rowDef.row, p);
        combineToMagicSquare([...square], newAvailableNumbers, i + 1)
      })
    }) 
  }

  const square = ol.rangeFilled(N * N, 0);
  const availableNumbers = ol.range(4 * 4).map(x => x + 1);
  const res = [];
  combineToMagicSquare(square, availableNumbers, 0);
  return res;
}