const { createDlx } = require('../dlx');

// Exact cover with 324 columns: cell filled, row has n, column has n, box has n.
// Every candidate (cell, n) is one row with its 4 column indices.
const solveSudoku = (grid) => {
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
  const solutions = createDlx(324, constraints).solve({ maxsolutions: 1 });

  if (solutions.length <= 0) throw Error('No solution found');

  return solutions[0].map((n) => rinfo[n]).reduce((res, ri) => ((res[ri.idx] = ri.n + 1), res), []);
};

module.exports = solveSudoku;
