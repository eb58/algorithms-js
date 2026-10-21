;((root, factory) => {
  const api = factory(
    typeof module !== 'undefined' && module.exports ? require('../sudoku5') : root.SudokuSolver5,
    typeof module !== 'undefined' && module.exports ? require('../sudokuUtils').isValidGrid : root.SudokuUtils?.isValidGrid
  )
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.Sudoku = api
})(typeof globalThis !== 'undefined' ? globalThis : this, (solve, validate) => {
  if (typeof solve !== 'function' || typeof validate !== 'function') throw new Error('Gemeinsamer Sudoku-Solver fehlt')
  const SIZE = 9
  const FULL = 0x1ff

  // Backtracking mit der Zelle der wenigsten Kandidaten zuerst. Bricht nach limit Lösungen ab und liefert ihre Anzahl
  // sowie die erste gefundene Lösung.
  const searchSolutions = (input, limit) => {
    if (!validate(input)) return { count: 0, solution: null, solutions: [] }
    const grid = input.slice()
    let count = 0
    let solution = null
    const solutions = []
    const rows = new Uint16Array(SIZE)
    const columns = new Uint16Array(SIZE)
    const boxes = new Uint16Array(SIZE)

    grid.forEach((value, index) => {
      if (!value) return
      const bit = 1 << (value - 1)
      const row = Math.floor(index / SIZE)
      const column = index % SIZE
      const box = Math.floor(row / 3) * 3 + Math.floor(column / 3)
      rows[row] |= bit
      columns[column] |= bit
      boxes[box] |= bit
    })

    const search = () => {
      let bestIndex = -1
      let bestMask = 0
      let bestCount = 10

      for (let index = 0; index < 81; index += 1) {
        if (grid[index]) continue
        const row = Math.floor(index / SIZE)
        const column = index % SIZE
        const box = Math.floor(row / 3) * 3 + Math.floor(column / 3)
        const mask = FULL & ~(rows[row] | columns[column] | boxes[box])
        const options = countBits(mask)
        if (options === 0) return false
        if (options < bestCount) {
          bestIndex = index
          bestMask = mask
          bestCount = options
          if (options === 1) break
        }
      }

      if (bestIndex < 0) {
        count += 1
        const found = grid.slice()
        solution ??= found
        solutions.push(found)
        return count >= limit
      }
      const row = Math.floor(bestIndex / SIZE)
      const column = bestIndex % SIZE
      const box = Math.floor(row / 3) * 3 + Math.floor(column / 3)

      for (let mask = bestMask; mask; mask &= mask - 1) {
        const bit = mask & -mask
        const value = 32 - Math.clz32(bit)
        grid[bestIndex] = value
        rows[row] |= bit
        columns[column] |= bit
        boxes[box] |= bit
        if (search()) return true
        grid[bestIndex] = 0
        rows[row] &= ~bit
        columns[column] &= ~bit
        boxes[box] &= ~bit
      }
      return false
    }

    search()
    return { count, solution, solutions }
  }

  // Anzahl der Lösungen, höchstens limit – mit dem Standardwert 2 genügt das für die Prüfung auf Eindeutigkeit.
  const countSolutions = (input, limit = 2) => searchSolutions(input, limit).count
  const findSolutions = (input, limit = 2) => searchSolutions(input, limit).solutions

  const countBits = (value) => {
    let count = 0
    while (value) {
      value &= value - 1
      count += 1
    }
    return count
  }

  const sanitizeRecognition = (input, confidence = []) => {
    const grid = input.slice()
    const removed = []
    const units = [
      ...Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, column) => row * 9 + column)),
      ...Array.from({ length: 9 }, (_, column) => Array.from({ length: 9 }, (_, row) => row * 9 + column)),
      ...Array.from({ length: 9 }, (_, box) => {
        const startRow = Math.floor(box / 3) * 3
        const startColumn = (box % 3) * 3
        return Array.from({ length: 9 }, (_, offset) => (startRow + Math.floor(offset / 3)) * 9 + startColumn + (offset % 3))
      })
    ]

    while (!validate(grid)) {
      const conflicts = new Set()
      for (const unit of units) {
        const positions = new Map()
        for (const index of unit) {
          const value = grid[index]
          if (!value) continue
          if (positions.has(value)) {
            conflicts.add(index)
            conflicts.add(positions.get(value))
          } else positions.set(value, index)
        }
      }
      if (!conflicts.size) break
      const index = [...conflicts].sort((left, right) => (confidence[left] ?? 0) - (confidence[right] ?? 0))[0]
      grid[index] = 0
      removed.push(index)
    }

    while (grid.filter(Boolean).length >= 17 && !solve(grid)) {
      const index = grid
        .map((value, position) => ({ value, position, confidence: confidence[position] ?? 0 }))
        .filter(({ value }) => value)
        .sort((left, right) => left.confidence - right.confidence)[0]?.position
      if (index === undefined) break
      grid[index] = 0
      removed.push(index)
    }

    return { grid, removed }
  }

  return { countSolutions, findSolutions, sanitizeRecognition, solve, validate }
})
