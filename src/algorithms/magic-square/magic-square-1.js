const combinations = require('../combinations');
const perm = require('../perm')[2];
const magicSquareUtils = require('./magic-square-utils');
const FastBitSet = require('fastbitset')

Array.prototype.sum = function (s, e) {
    s = s < 0 ? 0 : s;
    let sum = 0;
    for (let i = s || 0, len = e || this.length; i < len; i++) sum += this[i];
    return sum;
};

Array.prototype.subtract = function (xs){
  return this.filter( x => !xs.includes(x) )
};


const magicSquare = n => {
    const utils = magicSquareUtils(n)
    const MN = utils.computeMagicNumber(n);

    const magicFcts = (() => {

        const checkX1 = (square, availableNumbers, rowSumFct) => availableNumbers.includes(MN - rowSumFct(square));

        const checkX2 = (square, availableNumbers, cntNumbersInRows, rowSumFct) => {

            const rowSum = rowSumFct(square);
            const minSum = availableNumbers.sum(0, n - cntNumbersInRows);
            if (rowSum + minSum > MN) return false;

            const maxSum = availableNumbers.sum(availableNumbers.length - cntNumbersInRows);
            if (rowSum + maxSum < MN) return false;

            return true;
        };

        const checkX3 = (square, rowSumFct, availableSums) => availableSums.includes(MN - rowSumFct(square));


        const magicSquareIsPossible = (square, availableNumbers) => {
            if (square.length > n) {
                const cntNumbersInRows = utils.countNumbersInDiag1(square);

                if (cntNumbersInRows === n - 1) {
                    if (!checkX1(square, availableNumbers, utils.diag1Sum)) return false;
                    if (!checkX1(square, availableNumbers, utils.diag2Sum)) return false;
                    for (let c = 0; c < n; c++) {
                        if (!checkX1(square, availableNumbers, utils.colSum(square, c))) return false;
                    }
                }

                if (cntNumbersInRows > 1) {
                    if (!checkX2(square, availableNumbers, cntNumbersInRows, utils.diag1Sum)) return false;
                    if (!checkX2(square, availableNumbers, cntNumbersInRows, utils.diag2Sum)) return false;
                    for (let c = 0; c < n; c++) {
                        if (!checkX2(square, availableNumbers, cntNumbersInRows, utils.colSum(square, c))) return false;
                    }
                }

                if (cntNumbersInRows === n - 2) {
                    const availableSums = combinations(availableNumbers, 2).map(pair => pair[0] + pair[1]);

                    if (!checkX3(square, utils.diag1Sum, availableSums)) return false;
                    if (!checkX3(square, utils.diag2Sum, availableSums)) return false;
                    for (let c = 0; c < n; c++) {
                        if (!checkX3(square, utils.colSum(square, c), availableSums)) return false;
                    }
                }


            }
            return true;
        };


        return {
            magicSquareIsPossible,
        }
    })();

    const combineToMagicSquare = (square, combis, availableNumbers, res) => {

        if (utils.isMagic(square)) {
            res.push(square);
            // if (res.length % 100 === 0) utils.dump(res.length, square);
            return;
        }

        if (utils.numberOneIsNotInFirstQuad(square)) { // filter out symmetries
            return;
        }

        if (!magicFcts.magicSquareIsPossible(square, availableNumbers)) {
            return;
        }
        // console.log("combis", combis.map(c =>c.numbersArray), 'Available Numbers:', availableNumbers, 'SQUARE', square);
        combis.forEach(combi => {
            const newCombis = combis.filter(c => !c.numbersArray.intersects(combi.numbersArray));
            const newAvailableNumbers = availableNumbers.filter(n => !combi.numbersArray.has(n));
            combi.perms.forEach(perm => {
                combineToMagicSquare(square.concat(perm), newCombis, newAvailableNumbers, res)
            })
        });
    }

    const res = [];
    const square = []; // range(n * n).map(() => 0);
    const availableNumbers = utils.range(n * n).map(x => x + 1);
    const combis = combinations(availableNumbers, n)
        .filter(xs => xs.sum() === MN)
        .map(xs => ({
            numbersArray: new FastBitSet(xs),
            perms: perm(xs),
            availableSums: new Set(combinations(availableNumbers.subtract(xs),3).map(xs => xs.sum()))
         }))
           
    // console.log(JSON.stringify(combis,0,2));
    console.log(combis.length);
    combineToMagicSquare(square, combis, availableNumbers, res);
    return res;
}

module.exports = magicSquare;

