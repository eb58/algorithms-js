const permWithFilter = require('../perm').permWithFilter;
const magicFilter3x3 = (x) => {
    // horizontal
    if (x.length === 3 && x[0] + x[1] + x[2] !== 15) return false;
    if (x.length === 6 && x[3] + x[4] + x[5] !== 15) return false;
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

const magicFilter4x4 = (x) => {
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

const magicSquare3x3 = permWithFilter(magicFilter3x3);
const magicSquare4x4 = permWithFilter(magicFilter4x4);

module.exports = { magicSquare3x3, magicSquare4x4 };
