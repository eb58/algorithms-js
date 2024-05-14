const { range, feedX } = require('./ol').ol;
const matrix = {
  reshape: (xs, dim) => xs.reduce((acc, x, i) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []),
  redim: (mat, nrows, ncols, defVal = 0) => range(nrows).map((r) => range(ncols).map((c) => mat[r]?.[c] || defVal)),
  makeCopy: (mat) => mat.map((r) => [...r]),
  makeQuadratic: (mat, defVal = 0) => feedX(Math.max(mat.length, mat[0].length), (dim) => matrix.redim(mat, dim, dim, defVal)),
  transpose: (mat) => mat[0].map((_, ci) => mat.map((r) => r[ci])),
  translate: (mat, dr, dc, defVal = 0) => range(mat.length).map((r) => range(mat[0].length).map((c) => mat[r - dr]?.[c - dc] || defVal)),
  rotate90: (mat) => mat[0].map((_, idx) => mat.map((r) => r[r.length - idx - 1])),
  rotateN90: (mat, n) => range(n).reduce(matrix.rotate90, mat),
};

if (typeof module !== 'undefined') module.exports = matrix;
