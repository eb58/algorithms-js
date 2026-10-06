const { RANGE81, candidates, hasConflictingGivens } = require('./sudokuUtils');

// Fills the cell with the fewest candidates next (a cell with a single candidate at once).
const solve2a = (grid, emptyCells = RANGE81.filter(x => grid[x] === 0)) => {
    if (emptyCells.length === 0)
        return grid

    const candidatesForCells = [];
    emptyCells.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx].length === 1))
    const bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
    const newEmptyCells = emptyCells.filter(x => x !== bestIdx)
    return candidatesForCells[bestIdx].length === 1
        ? solve2a(grid.with(bestIdx, candidatesForCells[bestIdx][0]), newEmptyCells)
        : candidatesForCells[bestIdx].reduce((res, val) => res || solve2a(grid.with(bestIdx, val), newEmptyCells), null)
}

// Returns the solved grid, or null if there is no solution.
// A tie-break among cells with equally few candidates (most filled neighbours first) was tried
// and measured: no gain, the extra work per step eats up the better branching.
const solve2 = (grid) => hasConflictingGivens(grid) ? null : solve2a(grid)

module.exports = solve2
