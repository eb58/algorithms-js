module.exports = () => {
  /*  
   0  1  2  3
   4  5  6  7
   8  9 10 11
   12 13 14 15 
   */
  const _ = require('underscore');
  const ol = require('../../ol/ol').ol;
  const array = require('../../ol/ol').array;
  const comb = require('../combinations')[0];
  const perm = require('../perm').perm4;
  const magicSquareUtils = require('./magic-square-utils');

  const N = 4;
  const utils = magicSquareUtils(N);
  const MN = utils.computeMagicNumber();
  const idxNotForNumberOne = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const counter = {a: 0, b: 0, c: 0, x: 0, y: 0, z: 0, };

  const computeAvailable2Sums = _.memoize(availableNumbers => comb(availableNumbers, 2).map(x => x[0] + x[1]));
  const computeAvailable3Sums = _.memoize(availableNumbers => comb(availableNumbers, 3).map(x => x[0] + x[1] + x[2]));
  const setRow = (square, row, perm) => row.forEach((x, idx) => square[x] = perm[idx]);
  const numberOneIsNotInUpperLeft = xs => idxNotForNumberOne.some(x => xs[x] === 1);

  const check = {
    av2s: (xs, sq, availableNumbers) => {
      return true;
      const av2s = computeAvailable2Sums(availableNumbers);
      //const a2s = array(av2s).filter(x => x < 34).groupBy(ol.id);

      const x = (av2s.includes(MN - sq[0] - xs[0]) || av2s.includes(MN - sq[0] - xs[1]) || av2s.includes(MN - sq[0] - xs[2]) || av2s.includes(MN - sq[0] - xs[3]))
              && (av2s.includes(MN - sq[5] - xs[0]) || av2s.includes(MN - sq[5] - xs[1]) || av2s.includes(MN - sq[5] - xs[2]) || av2s.includes(MN - sq[5] - xs[3]))
              && (av2s.includes(MN - sq[10] - xs[0]) || av2s.includes(MN - sq[10] - xs[1]) || av2s.includes(MN - sq[10] - xs[2]) || av2s.includes(MN - sq[10] - xs[3]))
              && (av2s.includes(MN - sq[15] - xs[0]) || av2s.includes(MN - sq[15] - xs[1]) || av2s.includes(MN - sq[15] - xs[2]) || av2s.includes(MN - sq[15] - xs[3]))
      if (!x) {
        counter.a++
        return false;
      }
      return true;
    },
    av3s: (xs, sq, availableNumbers) => {
      return true;
      const a3s = array(computeAvailable3Sums(availableNumbers).filter(x => x < 34)).groupBy(ol.id);
      const a3sCounter = Object.keys(a3s).reduce((acc, k) => (acc[k] = a3s[k].length, acc), {});
      const b = a3sCounter[MN - sq[0]] >= 2 && a3sCounter[MN - sq[5]] >= 2 && a3sCounter[MN - sq[10]] >= 2 && a3sCounter[MN - sq[15]] >= 2
      if (!b) {
        utils.dump('BBB', sq);
        console.log("AV3S", availableNumbers, MN - sq[0], MN - sq[5], MN - sq[10], MN - sq[15], 'a3sCounter', JSON.stringify(a3sCounter));
        counter.b++
        return false;
      }
      return true;
    },
    av2sum2: (xs, sq, availableNumbers) => {
       return true;
       // const a2s = array(computeAvailable2Sums(availableNumbers)).groupBy(ol.id);
      // const a3sCounter = Object.keys(a2s).reduce((acc, k) => (acc[k] = a2s[k].length, acc), {});
      // const needed = ol.range(34).reduce((acc,x) => (acc[x] =0,acc) , {});
      const avs = computeAvailable2Sums(availableNumbers);
      const x = avs.includes(MN - sq[0] - sq[12])
              && avs.includes(MN - sq[5] - sq[9])
              && avs.includes(MN - sq[6] - sq[10])
              && avs.includes(MN - sq[3] - sq[15])
              && avs.includes(MN - sq[0] - sq[3])
              && avs.includes(MN - sq[5] - sq[6])
              && avs.includes(MN - sq[9] - sq[10])
              && avs.includes(MN - sq[12] - sq[15])
      if (!x) {
        counter.x++
        return false;
      }
      return true;
    },
    avn2: (xs, sq, availableNumbers) => {
      // return true;
      const y = (availableNumbers.includes(MN - xs[0] - sq[5] - sq[9]) || availableNumbers.includes(MN - xs[1] - sq[5] - sq[9]))
              && (availableNumbers.includes(MN - xs[0] - sq[6] - sq[10]) || availableNumbers.includes(MN - xs[1] - sq[6] - sq[10]));
      if (!y) {
        counter.y++
        return false;
      }
      return true;
    },
    avn3: (xs, sq, availableNumbers) => {
      // return true;
      const z = (availableNumbers.includes(MN - xs[0] - sq[5] - sq[6]) || availableNumbers.includes(MN - xs[1] - sq[5] - sq[6]))
              && (availableNumbers.includes(MN - xs[0] - sq[9] - sq[10]) || availableNumbers.includes(MN - xs[1] - sq[9] - sq[10]));
      if (!z) {
        counter.z++
        return false;
      }
      return true;
    }
  }

  const rowsDef = [
    {row: [0, 5, 10, 15], restriction: xs => xs.sum() === MN}, // diag1
    {row: [12, 9, 6, 3], restriction:  (xs, sq, availableNumbers) => xs.sum() === MN && check.av2s(xs, sq, availableNumbers) }, // diag2
    {row: [1, 2], restriction: (xs, sq, availableNumbers) => sq[0] + xs[0] + xs[1] + sq[3] === MN 
              && check.av2sum2(xs, sq, availableNumbers) && check.avn2(xs, sq, availableNumbers)},
    {row: [4, 8], restriction: (xs, sq, availableNumbers) => sq[0] + xs[0] + xs[1] + sq[12] === MN 
              && check.avn3(xs, sq, availableNumbers)},
    {row: [7], restriction: (xs, sq) => xs[0] + sq[4] + sq[5] + sq[6] === MN},
    {row: [11], restriction: (xs, sq) => xs[0] + sq[8] + sq[9] + sq[10] === MN},
    {row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN},
    {row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN},
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
    const predicate = (square, availableNumbers, rowDef) => xs => rowDef.restriction(xs, square, availableNumbers);
    const combis = comb(availableNumbers, rowDef.row.length, predicate(square, availableNumbers, rowDef));

    if (i === 110 && combis.length > 0) {
      console.log('i:', i, 'combis#:', combis.length, combis, 'available:', availableNumbers.join(' '), 'available2sums:', computeAvailable2Sums(availableNumbers).sort().join(' '));
      utils.dump('aaa', square);//, JSON.stringify(x, 0, 3));
    }

    if (i > 1) {
       // return; 
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
  const availableNumbers = ol.range(N * N).map(x => x + 1);
  const res = [];
  combineToMagicSquare(square, availableNumbers, 0);
   console.log(counter); 
  return res;

}