Array.prototype.sum = function (s, e) {
    s = s < 0 ? 0 : s;
    let sum = 0;
    for (let i = s || 0, len = e || this.length; i < len; i++)
        sum += this[i];
    return sum;
};

Array.prototype.subtract = function (xs) {
    return this.filter(x => !xs.includes(x));
};

Array.prototype.isSubsetOf = function (xs) {
    return this.every(x => xs.includes(x));
};

const magicSquareUtils = n => {

    const nSqr = n * n;

    const utils = {
        dumpStr: square => {
            let res = "\n"
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    res += ("  " + utils.valAt(square, r, c)).substr(-3);
                }
                res += "\n";
            }
            return res;
        },
        dump: (prefix, square) => {
            console.log("DUMP " + prefix + utils.dumpStr(square));
        },
        intersect: (a, b) => {
            const alen = a.length, blen = b.length;
            for (let i = 0; i < alen; i++) {
                for (let j = 0; j < blen; j++) {
                    if (a[i] === b[j])
                        return true;
                }
            }
            return false;
        },
        range: n => [...Array(n).keys()],
        computeMagicNumber: () => utils.range(nSqr).map(x => x + 1).reduce((acc, x) => acc + x, 0) / n,
        isMagic: square => square.length === nSqr && utils.diag1SumOK(square) && utils.diag2SumOK(square) && utils.colSumOK(square),
        valAt: (square, r, c) => square[c + r * n],
        setRow: (square, row, perm) => {
            row.forEach((x, idx) => {
                square[x] = perm[idx]
            });
            return row.map((x, idx) => x < 0 ? x : perm[idx]);
        },
        sumOverRow: (square, row) => {
            let sum = 0;
            for (let i = 0; i < n; i++)
                sum += (square[row[i]] || 0);
            return sum;
        },
        cntOverRow: (square, row) => {
            let sum = 0;
            for (let i = 0; i < n; i++)
                sum += square[row[i]] ? 1 : 0;
            return sum;
        },
        rowSum: (square, r) => {
            const row = [];
            for (let c = 0; c < n; c++)
                row.push(c + r * n);
            return () => utils.sumOverRow(square, row);
        },
        colSum: (square, col) => {
            const row = [];
            for (let r = 0; r < n; r++)
                row.push(col + r * n);
            return () => utils.sumOverRow(square, row);
        },
        diag1SumOK: square => utils.diag1Sum(square) === MN,
        diag2SumOK: square => utils.diag2Sum(square) === MN,
        rowSumOK: (square, r) => utils.rowSum(square, r)() === MN,
        colSumOK: square => {
            for (let c = 0; c < n; c++)
                if (utils.colSum(square, c)() !== MN)
                    return false;
            return true;
        },
        diag1Sum: ((() => {
            const row = [];
            for (let i = 0; i < n; i++)
                row.push(i + i * n);
            return square => utils.sumOverRow(square, row);
        })()),
        diag2Sum: ((() => {
            const row = [];
            for (let i = 0; i < n; i++)
                row.push(i + (n - i - 1) * n);
            return square => utils.sumOverRow(square, row);
        })()),
        countNumbersInDiag1: ((() => {
            const row = [];
            for (let i = 0; i < n; i++)
                row.push(i + i * n);
            return square => utils.cntOverRow(square, row);
        })()),
        numberOneIsNotInFirstQuad: ((() => {

            const pos = []
            const N = Math.ceil(n / 2);

            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    pos.push(c + r * n)
                }
            }
            // console.log( "POS", pos );

            return square => {
                if (square.length < nSqr / 2)
                    return false;

                for (let i = 0, len = pos.length; i < len; i++)
                    if (square[pos[i]] === 1)
                        return false;
                return true;
            }
        })()),
    };

    const MN = utils.computeMagicNumber(n);

    return utils;

}

module.exports = magicSquareUtils;


