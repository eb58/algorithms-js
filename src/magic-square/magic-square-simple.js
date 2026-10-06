const permWithFilter = require('../perm').permWithFilter;
const magicFilter3x3 = (x) => {
  // horizontal
  if (x.length === 2 && x[0] + x[1] >= 15) return false;
  if (x.length === 2 && x[0] + x[1] < 15 - 9) return false;
  if (x.length === 3 && x[0] + x[1] + x[2] !== 15) return false;
  if (x.length === 6 && x[3] + x[4] + x[5] !== 15) return false;
  if (x.length === 9 && x[6] + x[7] + x[8] !== 15) return false;

  // vertical
  if (x.length === 4 && x[0] + x[3] >= 15) return false;
  if (x.length === 7 && x[0] + x[3] + x[6] !== 15) return false;
  if (x.length === 8 && x[1] + x[4] + x[7] !== 15) return false;
  if (x.length === 9 && x[2] + x[5] + x[8] !== 15) return false;

  // diag
  if (x.length === 7 && x[2] + x[4] + x[6] !== 15) return false;
  if (x.length === 9 && x[0] + x[4] + x[8] !== 15) return false;

  return true;
};

// Three of four cells of a line known: the fourth is forced and must be a number 1..16
// that is not used yet (x is a prefix of a permutation of 1..16).
const forcedIsFree = (x, partialSum) => {
  const forced = 34 - partialSum;
  return forced >= 1 && forced <= 16 && !x.includes(forced);
};

const magicFilter4x4 = (x) => {
  // horizontal
  if (x.length === 3 && !forcedIsFree(x, x[0] + x[1] + x[2])) return false;
  if (x.length === 4 && x[0] + x[1] + x[2] + x[3] !== 34) return false;
  if (x.length === 7 && !forcedIsFree(x, x[4] + x[5] + x[6])) return false;
  if (x.length === 8 && x[4] + x[5] + x[6] + x[7] !== 34) return false;
  if (x.length === 11 && !forcedIsFree(x, x[8] + x[9] + x[10])) return false;
  if (x.length === 12 && x[8] + x[9] + x[10] + x[11] !== 34) return false;
  if (x.length === 16 && x[12] + x[13] + x[14] + x[15] !== 34) return false;

  // vertical
  if (x.length === 9 && !forcedIsFree(x, x[0] + x[4] + x[8])) return false;
  if (x.length === 10 && !forcedIsFree(x, x[1] + x[5] + x[9])) return false;
  if (x.length === 11 && !forcedIsFree(x, x[2] + x[6] + x[10])) return false;
  if (x.length === 12 && !forcedIsFree(x, x[3] + x[7] + x[11])) return false;
  if (x.length === 13 && x[0] + x[4] + x[8] + x[12] !== 34) return false;
  if (x.length === 14 && x[1] + x[5] + x[9] + x[13] !== 34) return false;
  if (x.length === 15 && x[2] + x[6] + x[10] + x[14] !== 34) return false;
  if (x.length === 16 && x[3] + x[7] + x[11] + x[15] !== 34) return false;

  // diag
  if (x.length === 10 && !forcedIsFree(x, x[3] + x[6] + x[9])) return false;
  if (x.length === 11 && !forcedIsFree(x, x[0] + x[5] + x[10])) return false;

  if (x.length === 13 && x[3] + x[6] + x[9] + x[12] !== 34) return false;
  if (x.length === 16 && x[0] + x[5] + x[10] + x[15] !== 34) return false;

  // symmetry: only one of the 8 rotations/reflections, the normal form used in magic-square.js:
  // 1 at index 0 with x1 < x4, or at index 1, or at index 5 with x6 < x9
  if (x.length === 5 && x[0] === 1 && x[1] > x[4]) return false;
  if (x.length === 6 && x[0] !== 1 && x[1] !== 1 && x[5] !== 1) return false;
  if (x.length === 10 && x[5] === 1 && x[6] > x[9]) return false;

  return true;
};

// The 8 rotations/reflections of a 4x4 square.
const symmetries4x4 = (square) => {
  const rotate = (s) => s.map((_, i) => s[(3 - (i % 4)) * 4 + Math.floor(i / 4)]);
  const transpose = (s) => s.map((_, i) => s[(i % 4) * 4 + Math.floor(i / 4)]);
  const result = [];
  let current = square;
  for (let turn = 0; turn < 4; turn++) {
    result.push(current, transpose(current));
    current = rotate(current);
  }
  return result;
};

const magicSquare3x3 = permWithFilter(magicFilter3x3);
// Searches the squares in normal form only and adds their other 7 orientations.
const magicSquare4x4 = (xs) => permWithFilter(magicFilter4x4)(xs).flatMap(symmetries4x4);

module.exports = {
  magicSquare3x3,
  magicSquare4x4,
};
