const range = (n) => [...Array(n).keys()];
const feedX = (x, f) => f(x);

const gridString = (grid) => grid.reduce((acc, x, idx) => acc + (x === 0 ? ' ' : x) + ((idx + 1) % 9 === 0 ? '\n' : ' '), '');

const RANGE81 = range(9 * 9);
const RANGE1_9 = range(9).map((x) => x + 1);

const col = (x) => x % 9;
const row = (x) => Math.floor(x / 9);
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3);
const isCandidate = (grid, idx, val) => CONNECTIONSETS[idx].every((n) => grid[n] !== val);
const candidates = (grid, idx) => (grid[idx] == 0 ? RANGE1_9.filter((val) => isCandidate(grid, idx, val)) : undefined);

const CONNECTIONSETS = (() => {
  const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y);
  const connectionSet = (x) => RANGE81.reduce((acc, y) => (inSameConnectionSet(x, y) ? [...acc, y] : acc), []);
  return RANGE81.map(connectionSet);
})();

// Exact cover with 324 columns: cell filled, row has n, column has n, box has n.
// solver gets the rows as column indices (4 per candidate) and returns solutions as row indices.
const solveSudokuDlx = (grid, solver) => {
  const constraints = [];
  const rinfo = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const given = grid[idx] - 1;
      const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      for (let n = 0; n < 9; n++) {
        if (given >= 0 && n !== given) continue;
        constraints.push([idx, 81 + r * 9 + n, 162 + c * 9 + n, 243 + box * 9 + n]);
        rinfo.push({ idx, n });
      }
    }
  }
  const solutions = solver(constraints);

  if (solutions.length <= 0) throw Error('No solution found');

  return solutions[0].map((n) => rinfo[n]).reduce((res, ri) => ((res[ri.idx] = ri.n + 1), res), []);
};

module.exports = {
  RANGE1_9,
  RANGE81,
  CONNECTIONSETS,
  gridString,
  feedX,
  row,
  col,
  block,
  candidates,
  solveSudokuDlx
};
