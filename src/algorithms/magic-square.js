const permWithFilter = require('./permWithFilter');
const combinations = require('./combinations');
const perm = require('./perm')[2];

const magicFilter3 = (x) => {
    // horizontal
    if (x.length === 3 && x[0] + x[1] + x[2] !== 15) return false;
    if (x.length === 8 && x[3] + x[4] + x[5] !== 15) return false;
    if (x.length === 9 && x[6] + x[7] + x[8] !== 15) return false;

    // vertical
    if (x.length === 7 && x[0] + x[3] + x[6] !== 15) return false;
    if (x.length === 8 && x[1] + x[4] + x[7] !== 15) return false;
    if (x.length === 9 && x[2] + x[5] + x[8] !== 15) return false;

    // diag
    if (x.length === 7 && x[2] + x[4] + x[6] !== 15) return false;
    if (x.length === 9 && x[0] + x[4] + x[8] !== 15) return false;

    return true;
};

const magicFilter4 = (x) => {
    // horizontal
    if (x.length === 3 && x[0] + x[1] + x[2] >= 34) return false;
    if (x.length === 3 && x[0] + x[1] + x[2] < 34 - 16) return false;

    if (x.length === 4 && x[0] + x[1] + x[2] + x[3] !== 34) return false;
    if (x.length === 8 && x[4] + x[5] + x[6] + x[7] !== 34) return false;
    if (x.length === 12 && x[8] + x[9] + x[10] + x[11] !== 34) return false;
    if (x.length === 16 && x[12] + x[13] + x[14] + x[15] !== 34) return false;

    // vertical
    if (x.length === 13 && x[0] + x[4] + x[8] + x[12] !== 34) return false;
    if (x.length === 14 && x[1] + x[5] + x[9] + x[13] !== 34) return false;
    if (x.length === 15 && x[2] + x[6] + x[10] + x[14] !== 34) return false;
    if (x.length === 16 && x[3] + x[7] + x[11] + x[15] !== 34) return false;

    // diag
    if (x.length === 13 && x[3] + x[6] + x[9] + x[12] !== 34) return false;
    if (x.length === 16 && x[0] + x[5] + x[10] + x[15] !== 34) return false;

    return true;
};

const magicSquare3x3 = permWithFilter(magicFilter3);
const magicSquare4x4 = permWithFilter(magicFilter4);

Array.prototype.sum = function () {
    return this.reduce((sum, n) => sum + n, 0);
};

const magicSquare = n => {
    const nSqr = n * n;
    const dump = msq => {
        let res = ""
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                res += " " + valAt(msq, r, c);
            }
            res += "\n";
        }
        console.log("DUMP\n", res);
    }
    const intersect = (a, b) => a.filter(x => b.includes(x)).length > 0;
    const range = n => [...Array(n).keys()];
    const magicNumber = n => range(nSqr).map(x => x + 1).reduce((acc, x) => acc + x, 0) / n;
    const valAt = (msq, r, c) => msq[c + r * n];

    const MN = magicNumber(n);

    const isMagic = msq => {
        const colSumOK = (msq) => {
            let res = true;
            for (let c = 0; c < n && res; c++) {
                let sum = 0
                for (let r = 0; r < n; r++) sum += msq[c + r * n];
                res = res && sum === MN
            }
            // dump( msq );
            return res;
        };

        const diag1SumOK = msq => {
            let res = 0;
            for (let i = 0; i < n; i++) res += msq[i + i * n];
            return res === MN;
        };
        const diag2SumOK = msq => {
            let res = 0;
            for (let i = 0; i < n; i++) res += msq[i + (n - i - 1) * n];
            return res === MN;
        };

        return msq.length === nSqr && diag1SumOK(msq) && diag2SumOK(msq) && colSumOK(msq);
    }

    const combis = combinations(range(nSqr).map(x => x + 1), n).filter(xs => xs.sum() === MN);

    const combineToMagicSquare = (msq, combis, res) => {
        if (isMagic(msq)) {
            res.push(msq);
        }
        combis.forEach(combi => {
            const newCombis = combis.filter(c => !intersect(c, combi));
            perm(combi).forEach(perm => {
                combineToMagicSquare(msq.concat(perm), newCombis, res)
            })
        });
    }

    const res = [];
    combineToMagicSquare([], combis, res);
    return res;
}

module.exports = { magicSquare3x3, magicSquare4x4, magicSquare };
