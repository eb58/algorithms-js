const dlx_solve = require('../dlx');
const solve = require("../exact-cover")
const range = (n) => [...Array(n).keys()];

const solv = (problem) => solve(problem,1)

const solveSudoku = (grid, solver = dlx_solve) => {
  const constraints = [];
  const rinfo = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const n = grid[idx] - 1;
      if (n >= 0) {
        const constraint = range(324).map(() => 0);
        constraint[r * 9 + c] = 1;
        constraint[9 * 9 + r * 9 + n] = 1;
        constraint[9 * 9 * 2 + c * 9 + n] = 1;
        constraint[9 * 9 * 3 + (Math.floor(r / 3) * 3 + Math.floor(c / 3)) * 9 + n] = 1;
        constraints.push(constraint);
        rinfo.push({ idx, n });
      } else {
        for (let n = 0; n < 9; n++) {
          const constraint = range(324).map(() => 0);
          constraint[r * 9 + c] = 1;
          constraint[9 * 9 + r * 9 + n] = 1;
          constraint[9 * 9 * 2 + c * 9 + n] = 1;
          constraint[9 * 9 * 3 + (Math.floor(r / 3) * 3 + Math.floor(c / 3)) * 9 + n] = 1;
          constraints.push(constraint);
          rinfo.push({ idx, n });
        }
      }
    }

  const solutions = solver(constraints);
  if (solutions.length <= 0) throw Error('No solution found');
  return solutions[0].map((n) => rinfo[n]).reduce((res, ri) => ((res[ri.idx] = ri.n + 1), res), []);
};

module.exports = solveSudoku;
