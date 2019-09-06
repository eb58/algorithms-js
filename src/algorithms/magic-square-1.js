const combinations = require('./combinations');
const perm = require('./perm')[2];

Array.prototype.sum = function () {
    return this.reduce((sum, n) => sum + n, 0);
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
        const len = a.length;
        for (let i = 0; i < len; i++) {
            for (let j = 0; j < len; j++) {
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
                let res = 0;
                for (let i = 0; i < n; i++) res += (square[i + i * n] || 0);
                return res;
            },
            diag2Sum: square => {
                let res = 0;
                for (let i = 0; i < n; i++) res += (square[i + (n - i - 1) * n] || 0);
                return res;
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
                let res = 0;
                for (let r = 0; r < n; r++) res += square[col + r * n] ? 1 : 0
                return res;
            },
            countNumbersInDiag1: square => {
                let res = 0;
                for (let i = 0; i < n; i++) res += square[i + i * n] ? 1 : 0
                return res;
            },
            countNumbersInDiag2: square => {
                let res = 0;
                for (let i = 0; i < n; i++) res += square[i + (n - i - 1) * n];
                return res;
            }
        };


        const diag1SumOK = square => utilFcts.diag1Sum(square) === MN;
        const diag2SumOK = square => utilFcts.diag2Sum(square) === MN;
        const colSumOK = (square) => {
            let res = true;
            for (let c = 0; c < n && res; c++) res = res && utilFcts.colSum(square, c) === MN
            return res;
        };
        const rowSumOK = (square) => {
            let res = true;
            for (let c = 0; c < n && res; c++) res = res && utilFcts.rowSum(square, c) === MN
            return res;
        };

        const numberIsInFirstQuad = (square, number) => {
            const N = Math.ceil(n / 2);
            let res = false;
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    res = res || square[c + r * n] === number;
                }
            }
            return res;
        };

        const checkX = (square, availableNumbers, countNumbersInRow, rowSum) => {
            const cntNumbersInRow = countNumbersInRow(square);
            const rSum = rowSum(square);
            if (cntNumbersInRow === n - 1 && !availableNumbers.includes(MN - rSum)) {
                return false;
            }
            else if (cntNumbersInRow > 1) {
                const minSum = availableNumbers.slice(0, n - cntNumbersInRow).sum();
                const maxSum = availableNumbers.slice(-cntNumbersInRow).sum();
                if (rSum + minSum > MN || rSum + maxSum < MN) {
                    return false;
                }
            }
            return true
        };

        const cntNumbersInCol = (col) => (square) => utilFcts.countNumbersInCol(square, col);
        const colSum = (col) => (square) => utilFcts.colSum(square, col);

        const magicIsPossible = (square, availableNumbers) => {
            if (square.length > nSqr / 2 && !numberIsInFirstQuad(square, 1)) return false; // Symmetrien ausfiltern

            if (!checkX(square, availableNumbers, utilFcts.countNumbersInDiag1, utilFcts.diag1Sum)) return false;
            if (!checkX(square, availableNumbers, utilFcts.countNumbersInDiag2, utilFcts.diag2Sum)) return false;
            for (let c = 0; c < n; c++) {
                if (!checkX(square, availableNumbers, cntNumbersInCol(c), colSum(c) )) return false;
            }

            return true;
        };

        const isMagic = square => diag1SumOK(square) && diag2SumOK(square) && colSumOK(square) && rowSumOK(square);

        return {
            magicIsPossible,
            isMagic
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
        if (square.length > n && !magicFcts.magicIsPossible(square, availableNumbers)) {
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
