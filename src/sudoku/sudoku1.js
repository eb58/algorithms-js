const { candidates, isValidGrid } = require('./sudokuUtils')

// Fills the first empty cell with each of its candidates in turn.
const solve = (grid) => {
  const idx = grid.indexOf(0)
  return idx < 0 ? grid : candidates(grid, idx).reduce((res, cand) => res || solve(grid.with(idx, cand)), null)
}

// grid: 81 numbers 0..9, 0 = empty cell. Returns a new, solved grid, or null if there is no solution.
// Very slow on hard puzzles.
const solve1 = (grid) => (isValidGrid(grid) ? solve([...grid]) : null)

module.exports = solve1
