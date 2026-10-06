const range = (n) => [...Array(n).keys()];

const RANGE81 = range(9 * 9);
const RANGE1_9 = range(9).map((x) => x + 1);

const col = (x) => x % 9;
const row = (x) => Math.floor(x / 9);
// blocks are numbered column-wise: 0 1 2 down the left third, 3 4 5 in the middle, 6 7 8 on the right
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3);
// one pass over the neighbours collects the used digits as bits, instead of one pass per digit
const candidates = (grid, idx) => {
  if (grid[idx] !== 0) return undefined;
  let used = 0;
  for (const n of CONNECTIONSETS[idx]) used |= 1 << grid[n];
  return RANGE1_9.filter((val) => !(used & (1 << val)));
};

const CONNECTIONSETS = (() => {
  const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y);
  const connectionSet = (x) => RANGE81.reduce((acc, y) => (inSameConnectionSet(x, y) ? [...acc, y] : acc), []);
  return RANGE81.map(connectionSet);
})();

// The same given number twice in a row, column or block: the grid has no solution.
const hasConflictingGivens = (grid) => grid.some((val, idx) => val !== 0 && CONNECTIONSETS[idx].some((n) => n !== idx && grid[n] === val));

module.exports = {
  hasConflictingGivens,
  RANGE1_9,
  RANGE81,
  CONNECTIONSETS,
  row,
  col,
  block,
  candidates
};
