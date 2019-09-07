const combinations = require('./combinations');
const perm = require('./perm')[2];

Array.prototype.sum = function () { return this.reduce((sum, n) => sum + n, 0); };
Array.prototype.isSubsetOf = function (xs) { return this.every(x => xs.includes(x)); }

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

    const setRow = (square, row, perm) => row.forEach((val, idx) => square[val] = perm[idx]);
    const checkOK = (square, row, perm, availableNumbers) => row.reduce((acc, val, idx) =>
        acc && (square[val] === 0 && availableNumbers.includes(perm[idx]) || square[val] === perm[idx]), true);

    const magicFcts = (() => {
        const nSqr = n * n;

        const utilFcts = {
            rowSum: (square, row) => {
                let sum = 0;
                for (let c = 0; c < n; c++) sum += square[c + row * n];
                return sum;
            },
            colSum: (square, col) => {
                let sum = 0;
                for (let r = 0; r < n; r++) sum += square[col + r * n];
                return sum;
            }
        };

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

        const isMagic = square => colSumOK(square) && rowSumOK(square);

        return {
            isMagic
        }
    })();

    const generateRows = n => {
        const rows = [];

        { // diag1
            const row = [];
            for (let i = 0; i < n; i++) row.push(i + i * n);
            rows.push(row);
        }
        { // diag2
            const row = [];
            for (let i = 0; i < n; i++) row.push(i + (n - i - 1) * n);
            rows.push(row);
        }
        for (let r = 0; r < n; r++) { // rows
            const row = [];
            for (let c = 0; c < n; c++) row.push(c + r * n);
            rows.push(row);
        }
        for (let c = 0; c < n; c++) { // cols
            const row = [];
            for (let r = 0; r < n; r++) row.push(c + r * n);
            rows.push(row);
        }
        return rows;
    }

    const rows = generateRows(n);

    const combis =
        combinations(range(n * n).map(x => x + 1), n)
            .filter(xs => xs.sum() === MN)
            .map(xs => ({ numbersArray: xs, perms: perm(xs) }))
            .filter(perm => perm);

    const combineToMagicSquare = (square, combis, availableNumbers, lev, res) => {
        if (availableNumbers.length === 0 && magicFcts.isMagic(square)) {
            dump(res.length, square);
            res.push(square);
            return;
        }
        //console.log("combis", combis.map(c => c.numbersArray), 'Available Numbers:', availableNumbers, 'SQUARE', square, 'LEV', lev);
        combis.forEach((combi, idx) => {
            const newCombis =
                [...combis.slice(0, idx), ...combis.slice(idx + 1)]
                    .filter(c => lev <= 1 ? true : rows[lev].filter(x => x!=0).map(v => square[v]).isSubsetOf(c.numbersArray));
            const newAvailableNumbers = availableNumbers.filter(n => !combi.numbersArray.includes(n));
            combi.perms.forEach(perm => {
                if (checkOK(square, rows[lev], perm, availableNumbers)) {
                    const lsquare = [...square];
                    setRow(lsquare, rows[lev], perm);
                    dump('', lsquare);
                    combineToMagicSquare(lsquare, newCombis, newAvailableNumbers, lev + 1, res)
                }
            })
        });
    }

    const res = [];
    const square = range(n * n).map(() => 0);
    const availableNumbers = range(n * n).map(x => x + 1);

    combineToMagicSquare(square, combis, availableNumbers, 0, res);
    return res;
}

module.exports = magicSquare;
