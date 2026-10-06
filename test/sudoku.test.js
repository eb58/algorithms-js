const solve1 = require('../src/sudoku/sudoku1')
const solve2 = require('../src/sudoku/sudoku2')
const solve3 = require('../src/sudoku/sudoku3')
const solve4 = require('../src/sudoku/sudoku4')
const solveDlx1 = require('../src/sudoku/sudokuDlx1')
const { EASY, HARD, toGrid } = require('../src/sudoku/sudokuPuzzles')

// Timings of all solvers: npm run benchmark:sudoku
// sudoku1 takes far too long for the hard puzzles, it only gets the easy ones.
const SOLVERS = [
  { name: 'sudoku1', solve: solve1, puzzles: EASY },
  { name: 'sudoku2', solve: solve2, puzzles: [...EASY, ...HARD] },
  { name: 'sudoku3', solve: solve3, puzzles: [...EASY, ...HARD] },
  { name: 'sudoku4', solve: solve4, puzzles: [...EASY, ...HARD] },
  { name: 'sudokuDlx1', solve: solveDlx1, puzzles: [...EASY, ...HARD] }
]

const range = (n) => [...Array(n).keys()]
const units = [
  ...range(9).map((r) => range(9).map((c) => r * 9 + c)), // rows
  ...range(9).map((c) => range(9).map((r) => r * 9 + c)), // columns
  ...range(9).map((b) => range(9).map((i) => (Math.floor(b / 3) * 3 + Math.floor(i / 3)) * 9 + (b % 3) * 3 + (i % 3))) // blocks
]

// result is a complete, valid sudoku that keeps every given number of puzzle
const isValidSolution = (puzzle, result) =>
  Array.isArray(result) &&
  result.length === 81 &&
  units.every(
    (unit) =>
      unit
        .map((idx) => result[idx])
        .sort()
        .join('') === '123456789'
  ) &&
  puzzle.every((val, idx) => val === 0 || result[idx] === val)

// row 0 holds 2..9, column 0 holds 1: the first cell cannot be filled
const noCandidateGrid = () => {
  const grid = Array(81).fill(0)
  for (let c = 1; c < 9; c++) grid[c] = c + 1
  grid[36] = 1
  return grid
}

describe('sudokuPuzzles', () => {
  test('every solution is a valid sudoku with the givens of its puzzle', () => {
    ;[...EASY, ...HARD].forEach(([puzzle, solution]) => expect(isValidSolution(toGrid(puzzle), toGrid(solution))).toBe(true))
  })
})

describe.each(SOLVERS)('$name', ({ solve, puzzles }) => {
  test(`solves ${puzzles.length} puzzles`, () => {
    puzzles.forEach(([puzzle, solution]) => expect(solve(toGrid(puzzle)).join('')).toEqual(solution))
  })

  test('leaves the input unchanged', () => {
    const [puzzle] = EASY[0]
    const grid = toGrid(puzzle)
    solve(grid)
    expect(grid).toEqual(toGrid(puzzle))
  })

  test('returns an already solved grid as it is, as a new array', () => {
    const [, solution] = EASY[0]
    const grid = toGrid(solution)
    const result = solve(grid)
    expect(result).toEqual(grid)
    expect(result).not.toBe(grid)
  })

  test('finds a valid solution for the empty grid', () => {
    const empty = Array(81).fill(0)
    expect(isValidSolution(empty, solve(empty))).toBe(true)
  })

  test('returns null if a cell has no candidate', () => {
    expect(solve(noCandidateGrid())).toBeNull()
  })

  test('returns null for the same given number twice in a row', () => {
    expect(solve([1, 1, ...Array(79).fill(0)])).toBeNull()
  })
})
