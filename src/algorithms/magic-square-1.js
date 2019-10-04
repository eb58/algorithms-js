const combinations = require('./combinations');
const perm = require('./perm')[2];
const FastBitSet = require('fastbitset')

Array.prototype.sum = function (s, e) {
    s = s < 0 ? 0 : s;
    let sum = 0;
    for (let i = s || 0, len = e || this.length; i < len; i++) sum += this[i];
    return sum;
};

const magicSquare = n => {
    const dump = (prefix, square) => {
        let res = ""
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                res += ("  " + valAt(square, r, c)).substr(-3);
            }
            res += "\n";
        }
        console.log("DUMP " + prefix + "\n" + res);
    }

    const intersect = (a, b) => {
        const alen = a.length, blen = b.length;
        for (let i = 0; i < alen; i++) {
            for (let j = 0; j < blen; j++) {
                if (a[i] === b[j]) return true;
            }
        }
        return false;
    }

    const range = n => [...Array(n).keys()];
    const magicNumber = n => range(n * n).map(x => x + 1).reduce((acc, x) => acc + x, 0) / n;
    const valAt = (square, r, c) => square[c + r * n];

    const MN = magicNumber(n);

    const magicFcts = (() => {
        const nSqr = n * n;

        const utilFcts = {
            sumOverRow: (square, row) => {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += (square[row[i]] || 0);
                return sum;
            },
            cntOverRow: (square, row) => {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += square[row[i]] ? 1 : 0;
                return sum;
            },
            diag1Sum: (() => {
                const row = [];
                for (let i = 0; i < n; i++) row.push(i + i * n);
                return square => utilFcts.sumOverRow(square, row);
            })(),
            diag2Sum: (() => {
                const row = [];
                for (let i = 0; i < n; i++) row.push(i + (n - i - 1) * n);
                return square => utilFcts.sumOverRow(square, row);
            })(),
            rowSum: (square, r) => {
                const row = [];
                for (let c = 0; c < n; c++) row.push(c + r * n);
                return () => utilFcts.sumOverRow(square, row);
            },
            colSum: (square, col) => {
                const row = [];
                for (let r = 0; r < n; r++) row.push(col + r * n);
                return () => utilFcts.sumOverRow(square, row);
            },
            countNumbersInDiag1: (() => {
                const row = [];
                for (let i = 0; i < n; i++) row.push(i + i * n);
                return square => utilFcts.cntOverRow(square, row);
            })()
        };

        const diag1SumOK = square => utilFcts.diag1Sum(square) === MN;
        const diag2SumOK = square => utilFcts.diag2Sum(square) === MN;
        const rowSumOK = (square, r) => utilFcts.rowSum(square, r)() === MN;
        const colSumOK = square => {
            for (let c = 0; c < n; c++) if (utilFcts.colSum(square, c)() !== MN) return false;
            return true;
        };
        const numberOneIsNotInFirstQuad = (() => {

            const pos = []
            const N = Math.ceil(n / 2);

            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    pos.push(c + r * n)
                }
            }

            return square => {
                if (square.length < nSqr / 2)
                    return false;

                for (let i = 0, len = pos.length; i < len; i++) if (square[pos[i]] === 1) return false;
                return true;
            }
        })();

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
                const cntNumbersInRows = utilFcts.countNumbersInDiag1(square);

                if (cntNumbersInRows === n - 1) {
                    if (!checkX1(square, availableNumbers, utilFcts.diag1Sum)) return false;
                    if (!checkX1(square, availableNumbers, utilFcts.diag2Sum)) return false;
                    for (let c = 0; c < n; c++) {
                        if (!checkX1(square, availableNumbers, utilFcts.colSum(square, c))) return false;
                    }
                }

                if (cntNumbersInRows > 1) {
                    if (!checkX2(square, availableNumbers, cntNumbersInRows, utilFcts.diag1Sum)) return false;
                    if (!checkX2(square, availableNumbers, cntNumbersInRows, utilFcts.diag2Sum)) return false;
                    for (let c = 0; c < n; c++) {
                        if (!checkX2(square, availableNumbers, cntNumbersInRows, utilFcts.colSum(square, c))) return false;
                    }
                }

                if (cntNumbersInRows === n - 2) {
                    const availableSums = combinations(availableNumbers, 2).map(pair => pair[0] + pair[1]);

                    if (!checkX3(square, utilFcts.diag1Sum, availableSums)) return false;
                    if (!checkX3(square, utilFcts.diag2Sum, availableSums)) return false;
                    for (let c = 0; c < n; c++) {
                        if (!checkX3(square, utilFcts.colSum(square, c), availableSums)) return false;
                    }
                }


            }
            return true;
        };

        const isMagic = square => square.length === nSqr && diag1SumOK(square) && diag2SumOK(square) && colSumOK(square);

        return {
            magicSquareIsPossible,
            isMagic,
            numberOneIsNotInFirstQuad
        }
    })();

    const combis =
        combinations(range(n * n).map(x => x + 1), n)
            .filter(xs => xs.sum() === MN)
            .map(xs => ({ numbersArray: new FastBitSet(xs), perms: perm(xs) }));

        // const x = combis.map(c => c.numbersArray);    console.log("Combis", x.length, x);
    const combineToMagicSquare = (square, combis, availableNumbers, res) => {

        if (magicFcts.isMagic(square)) {
            res.push(square);
            // if (res.length % 100 === 0) dump(res.length, square);
            return;
        }

        if (magicFcts.numberOneIsNotInFirstQuad(square)) { // filter out symmetries
            return;
        }

        if (!magicFcts.magicSquareIsPossible(square, availableNumbers)) {
            return;
        }
        // console.log("combis", combis.map(c =>c.numbersArray), 'Available Numbers:', availableNumbers, 'SQUARE', square);
        combis.forEach(combi => {
            const newCombis = combis.filter(c => !c.numbersArray.intersects( combi.numbersArray));
            const newAvailableNumbers = availableNumbers.filter(n => !combi.numbersArray.has(n));
            combi.perms.forEach(perm => {
                combineToMagicSquare(square.concat(perm), newCombis, newAvailableNumbers, res)
            })
        });
    }

    const res = [];
    const square = [];
    const availableNumbers = range(n * n).map(x => x + 1);

    combineToMagicSquare(square, combis, availableNumbers, res);
    return res;
}

module.exports = magicSquare;
