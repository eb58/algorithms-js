const { feedX } = require('../ol').ol;
const { candidates, hasConflictingGivens } = require('./sudokuUtils');
const idxOfFirstEmptyCell = (grid) => grid.findIndex(x => x === 0)

const search = (grid) => feedX(
    idxOfFirstEmptyCell(grid),
    (idx) => idx < 0 ? grid : candidates(grid, idx).reduce((res, val) => res || search(grid.with(idx, val)), null)
)

// Returns the solved grid, or null if there is no solution. Very slow on hard puzzles.
const solve1 = (grid) => hasConflictingGivens(grid) ? null : search(grid)

module.exports = solve1
