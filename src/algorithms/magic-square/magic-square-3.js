const combinations = require('../combinations');
const perm = require('../perm')[2];
const magiqSuareUtils= require('./magic-square-utils');

Array.prototype.sum = function () { return this.reduce((sum, n) => sum + n, 0); };
Array.prototype.isSubsetOf = function (xs) { return this.every(x => xs.includes(x)); }

const magicSquare = n => {
    const utils = magiqSuareUtils(n)
    const MN = utils.magicNumber(n);

    const magicFcts = (() => {
        const nSqr = n * n;

        const colSumOK = (square) => {
            let res = true;
            for (let c = 0; c < n && res; c++) res = res && utils.colSum(square, c) === MN
            return res;
        };
        const rowSumOK = (square) => {
            let res = true;
            for (let c = 0; c < n && res; c++) res = res && utils.rowSum(square, c) === MN
            return res;
        };

        const isMagic = square => colSumOK(square) && rowSumOK(square);

        return {
            isMagic
        }
    })();

    const rows = [
        /*   0  1  2  3
             4  5  6  7
             8  9 10 11
            12 13 14 15
        */

        { row: [0, 5, 10, 15] }, // diag1
        { row: [12, 9, 6, 3] },  // diag2

        {
            row: [1, 2], restriction: (square, perm, availableNumbers) => {

                if (square[0] + perm[0] + perm[1] + square[3] !== MN)
                    return false;

                if (!availableNumbers.includes(MN - (perm[0] + square[5] + square[9])))
                    return false;
                if (!availableNumbers.includes(MN - (perm[1] + square[6] + square[10])))
                    return false;

                return true;
            }
        },
        {
            row: [13],
            restriction: (square, perm, availableNumbers) => {
                if (!availableNumbers.includes(MN - (square[1] + square[5] + square[9])))
                    return false;
                return true;
            },
            setValue: square => {
                square[13] = MN - (square[1] + square[5] + square[9]);
                return square[13];
            }
        },
        {
            row: [14],
            restriction: (square, perm, availableNumbers) => {
                if (!availableNumbers.includes(MN - (square[2] + square[6] + square[10])))
                    return false;
                return true;
            },
            setValue: square => {
                square[14] = MN - (square[2] + square[6] + square[10]);
                return square[14];
            }
        },
        {
            row: [4, 8], restriction: (square, perm, availableNumbers) => {

                if (square[0] + perm[0] + perm[1] + square[12] !== MN)
                    return false;

                if (!availableNumbers.includes(MN - (perm[0] + square[5] + square[6])))
                    return false;
                if (!availableNumbers.includes(MN - (perm[1] + square[9] + square[10])))
                    return false;

                if (!availableNumbers.includes(MN - (square[1] + square[5] + square[9])))
                    return false;
                if (!availableNumbers.includes(MN - (square[2] + square[6] + square[10])))
                    return false;

                return true;
            }
        },
        {
            row: [7], setValue: square => {
                square[7] = MN - (square[4] + square[5] + square[6]);
                return square[7];
            }
        },
        {
            row: [11], setValue: square => {
                square[11] = MN - (square[8] + square[9] + square[10]);
                return square[11];
            }
        },


        // { row: [13, 14], restriction: square => square[12] + perm[0] + perm[1] + square[15] === MN },
        // { row: [7, 11], restriction: square => square[3] + perm[0] + perm[1] + square[15] === MN },
        //{ row: [13], compute: (square) => square[1] + square[5] + square[9] },
        // { row: [14], compute: (square) => square[2] + square[6] + square[10] },

        //{ row: [7], compute: (square) => square[4] + square[5] + square[6] },
        // { row: [11], compute: (square) => square[8] + square[9] + square[10] }
    ]

    const combineToMagicSquare = (square, combis, availableNumbers, lev, res) => {
        // dump(res.length, square);
        if (availableNumbers.length === 0 && magicFcts.isMagic(square)) {
            dump(res.length, square);
            res.push(square);
            return;
        }
        // console.log(dumpStr(square), "combis", combis.map(c => c.numbersArray), 'Available Numbers:', availableNumbers, 'LEV', lev);
        const row = rows[lev];
        combis.forEach((combi, idx) => {
            combi.perms.forEach(p => {
                if (row.restriction && !row.restriction(square, p, availableNumbers))
                    return;

                if (row.setValue) {

                    const lsquare = [...square];
                    const valueSet = row.setValue(lsquare);
                    const newAvailableNumbers = availableNumbers.filter(n => n != valueSet);
                    newCombis = combinations(newAvailableNumbers, rows[lev + 1].row.length).map(xs => ({ numbersArray: xs, perms: perm(xs) }));
                    combineToMagicSquare(lsquare, newCombis, newAvailableNumbers, lev + 1, res)

                } else {

                    const lsquare = [...square];
                    const valuesSet = setRow(lsquare, row.row, p);
                    const newAvailableNumbers = availableNumbers.filter(n => !valuesSet.includes(n));
                    const newCombis = rows[lev + 1].row.length === 4
                        ? combis.filter(c => !intersect(c.numbersArray, valuesSet))
                        : combinations(newAvailableNumbers, rows[lev + 1].row.length).map(xs => ({ numbersArray: xs, perms: perm(xs) }));
                    combineToMagicSquare(lsquare, newCombis, newAvailableNumbers, lev + 1, res)

                }

            })
        });
    }

    const res = [];
    const square = range(n * n).map(() => 0);
    const availableNumbers = range(n * n).map(x => x + 1);
    const combis =
        combinations(availableNumbers, n)
            .filter(xs => xs.sum() === MN)
            .map(xs => ({ numbersArray: xs, perms: perm(xs) }))


    combineToMagicSquare(square, combis, availableNumbers, 0, res);
    return res;
}

module.exports = magicSquare;
