const combinations = require('./combinations');
const perm = require('./perm')[2];

Array.prototype.sum = function (s, e) {
    let sum = 0;
    for (let i = s || 0, len = e || this.length; i < len; i++) sum += this[i];
    return sum;
};

const magicSquare = n => {
    const dump = (prefix, square) => {
        let res = ""
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                res += " " + (valAt(square, r, c) || '#');
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
            diag1Sum: square => {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += (square[i + i * n] || 0);
                return sum;
            },
            diag2Sum: square => {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += (square[i + (n - i - 1) * n] || 0);
                return sum;
            },
            rowSum: (square, row) => {
                let sum = 0;
                for (let c = 0; c < n; c++) sum += (square[c + row * n] || 0);
                return sum;
            },
            colSum: (square, col) => {
                let sum = 0;
                for (let r = 0; r < n; r++) sum += (square[col + r * n] || 0);
                return sum;
            },
            countNumbersInCol: (square, col) => {
                let cnt = 0;
                for (let r = 0; r < n; r++) cnt += square[col + r * n] ? 1 : 0
                return cnt;
            },
            countNumbersInDiag1: square => {
                let cnt = 0;
                for (let i = 0; i < n; i++) cnt += square[i + i * n] ? 1 : 0
                return cnt;
            },
            countNumbersInDiag2: square => {
                let cnt = 0;
                for (let i = 0; i < n; i++) cnt += square[i + (n - i - 1) * n];
                return cnt;
            }
        };

        const diag1SumOK = square => utilFcts.diag1Sum(square) === MN;
        const diag2SumOK = square => utilFcts.diag2Sum(square) === MN;
        const colSumOK = (square) => {
            for (let c = 0; c < n && res; c++) if (utilFcts.colSum(square, c) !== MN) return false;
            return true;
        };
        const rowSumOK = (square) => {
            for (let c = 0; c < n && res; c++)  if (utilFcts.rowSum(square, c) !== MN) return false;
            return true;
        };

        const numberOneIsNotInFirstQuad = (square) => {
            if (square.length < nSqr / 2)
                return false;

            const N = Math.ceil(n / 2);
            for (let r = 0; r < N; r++) {
                const rn = r * n;
                for (let c = 0; c < N; c++) {
                    if (square[c + rn] === 1) return false;
                }
            }
            return true;
        };

        const checkX1 = (square, availableNumbers, rowSum) => availableNumbers.includes(MN - rowSum(square));

        const checkX2 = (square, availableNumbers, cntNumbersInRows, rowSum) => {

            const rSum = rowSum(square);
            const minSum = availableNumbers.slice(0, n - cntNumbersInRows).sum();
            if (rSum + minSum > MN) return false;

            const maxSum = availableNumbers.slice(-cntNumbersInRows).sum();
            if (rSum + maxSum < MN) return false;

            return true
        };

        const colSum = (col) => (square) => utilFcts.colSum(square, col);

        const magicSquareIsPossible = (square, availableNumbers) => {
            const cntNumbersInRows = utilFcts.countNumbersInDiag1(square);

            if (cntNumbersInRows === n - 1) {
                if (!checkX1(square, availableNumbers, utilFcts.diag1Sum)) return false;
                if (!checkX1(square, availableNumbers, utilFcts.diag2Sum)) return false;
                for (let c = 0; c < n; c++) {
                    if (!checkX1(square, availableNumbers, colSum(c))) return false;
                }
            }
            
            if (cntNumbersInRows > 1) {
                if (!checkX2(square, availableNumbers, cntNumbersInRows, utilFcts.diag1Sum)) return false;
                if (!checkX2(square, availableNumbers, cntNumbersInRows, utilFcts.diag2Sum)) return false;
                for (let c = 0; c < n; c++) {
                    if (!checkX2(square, availableNumbers, cntNumbersInRows, colSum(c))) return false;
                }
            }

            return true;
        };

        const isMagic = square => diag1SumOK(square) && diag2SumOK(square) && colSumOK(square) && rowSumOK(square);

        return {
            magicSquareIsPossible: magicSquareIsPossible,
            isMagic,
            numberOneIsNotInFirstQuad
        }
    })();

    const combis =
        combinations(range(n * n).map(x => x + 1), n)
            .filter(xs => xs.sum() === MN)
            .map(xs => ({ numbersArray: xs, perms: perm(xs) }))
            .filter(perm => perm);

    const combineToMagicSquare = (square, combis, availableNumbers, res) => {

        if (availableNumbers.length === 0 && magicFcts.isMagic(square)) {
            res.push(square);
            // dump(res.length, square);
            return;
        }

        if (magicFcts.numberOneIsNotInFirstQuad(square)) { // Symmetrien ausfiltern
            return;
        }

        if (square.length > n && !magicFcts.magicSquareIsPossible(square, availableNumbers)) {
            return;
        }
        // console.log("combis", combis.map(c =>c.numbersArray), 'Available Numbers:', availableNumbers, 'SQUARE', square);
        combis.forEach(combi => {
            const newCombis = combis.filter(c => !intersect(c.numbersArray, combi.numbersArray));
            const newNumbers = availableNumbers.filter(n => !combi.numbersArray.includes(n));
            combi.perms.forEach(perm => {
                combineToMagicSquare(square.concat(perm), newCombis, newNumbers, res)
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
