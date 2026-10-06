const { RANGE81, candidates, hasConflictingGivens } = require('./sudokuUtils')

// Fills the cell with the fewest candidates next (a cell with a single candidate at once).
const solve = (grid, emptyCells = RANGE81.filter((x) => grid[x] === 0)) => {
  if (emptyCells.length === 0) return grid

  let bestIdx = -1
  let bestCands = null
  for (const idx of emptyCells) {
    const cands = candidates(grid, idx)
    if (!bestCands || cands.length < bestCands.length) {
      bestIdx = idx
      bestCands = cands
    }
    if (cands.length <= 1) break // one candidate: fill it now; none: dead end
  }

  const newEmptyCells = emptyCells.filter((x) => x !== bestIdx)
  return bestCands.length === 1
    ? solve(grid.with(bestIdx, bestCands[0]), newEmptyCells)
    : bestCands.reduce((res, val) => res || solve(grid.with(bestIdx, val), newEmptyCells), null)
}

// grid: 81 numbers 0..9, 0 = empty cell. Returns a new, solved grid, or null if there is no solution.
// A tie-break among cells with equally few candidates (most filled neighbours first) was tried
// and measured: no gain, the extra work per step eats up the better branching.
const solve2 = (grid) => (hasConflictingGivens(grid) ? null : solve([...grid]))

module.exports = solve2
