const { candidates, hasConflictingGivens } = require('./sudokuUtils');

// Fills the first empty cell with each of its candidates in turn.
const search = (grid) => {
    const idx = grid.indexOf(0)
    return idx < 0 ? grid : candidates(grid, idx).reduce((res, val) => res || search(grid.with(idx, val)), null)
}

// Returns the solved grid, or null if there is no solution. Very slow on hard puzzles.
const solve1 = (grid) => hasConflictingGivens(grid) ? null : search(grid)

module.exports = solve1
