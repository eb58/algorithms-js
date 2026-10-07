const { createDlx } = require('../dlx')
const { isValidGrid } = require('./sudokuUtils')

// Exact cover with 324 columns: cell filled, row has n, column has n, box has n.
// Build all 729 candidate rows once; row index = cell * 9 + digit - 1.
// solve() restores the links even after an early stop, so subsequent puzzles can reuse them.
const dlx = (() => {
  const constraints = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c
      const box = Math.floor(r / 3) * 3 + Math.floor(c / 3)
      for (let n = 0; n < 9; n++) {
        constraints.push([idx, 81 + r * 9 + n, 162 + c * 9 + n, 243 + box * 9 + n])
      }
    }
  }
  return createDlx(324, constraints)
})()

// grid: 81 numbers 0..9, 0 = empty. Returns a new solution, or null for invalid/unsatisfiable input.
const solveSudoku = (grid) => {
  if (!isValidGrid(grid)) return null
  const fixedRows = []
  for (let idx = 0; idx < 81; idx++) {
    const digit = grid[idx]
    if (digit === 0) continue
    fixedRows.push(idx * 9 + digit - 1)
  }
  const solutions = dlx.solve({ maxsolutions: 1, fixedRows })

  if (solutions.length === 0) return null

  const result = []
  for (const option of solutions[0]) result[Math.floor(option / 9)] = (option % 9) + 1
  return result
}

module.exports = solveSudoku
