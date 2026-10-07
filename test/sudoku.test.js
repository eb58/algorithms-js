const solve1 = require('../src/sudoku/sudoku1')
const solve2 = require('../src/sudoku/sudoku2')
const solve3 = require('../src/sudoku/sudoku3')
const solve4 = require('../src/sudoku/sudoku4')
const solve5 = require('../src/sudoku/sudoku5')
const solveDlx = require('../src/sudoku/sudokuDlx')
const { EASY, HARD, ALL, toGrid } = require('../src/sudoku/sudokuPuzzles')

// Timings of all solvers: npm run benchmark:sudoku
// sudoku1 takes far too long for the hard puzzles, it only gets the easy ones.
const SOLVERS = [
  { name: 'sudoku1', solve: solve1, puzzles: EASY },
  { name: 'sudoku2', solve: solve2, puzzles: ALL },
  { name: 'sudoku3', solve: solve3, puzzles: ALL },
  { name: 'sudoku4', solve: solve4, puzzles: ALL },
  { name: 'sudoku5', solve: solve5, puzzles: ALL },
  { name: 'sudokuDlx', solve: solveDlx, puzzles: ALL }
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
    ALL.forEach(([puzzle, solution]) => expect(isValidSolution(toGrid(puzzle), toGrid(solution))).toBe(true))
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

  test.each([27, 10])('returns null for conflicting givens at cells 0 and %i', (other) => {
    const grid = Array(81).fill(0)
    grid[0] = grid[other] = 1 // column only / block only
    expect(solve(grid)).toBeNull()
  })

  test.each([null, [], Array(80).fill(0), [10, ...Array(80).fill(0)], ['1', ...Array(80).fill(0)]])(
    'returns null for malformed input',
    (grid) => expect(solve(grid)).toBeNull()
  )
})

describe('sudokuDlx shared matrix', () => {
  test('can alternate solved, contradictory, unsatisfiable and empty puzzles', () => {
    const [puzzle, solution] = HARD[0]
    const impossible = toGrid('300000012000000003002300400001800005060070800000009000008500000900040500470006000')
    for (let round = 0; round < 3; round++) {
      expect(solveDlx(toGrid(puzzle)).join('')).toBe(solution)
      expect(solveDlx(toGrid(solution)).join('')).toBe(solution)
      expect(solveDlx([1, 1, ...Array(79).fill(0)])).toBeNull()
      const before = [...impossible]
      expect(solveDlx(impossible)).toBeNull()
      expect(impossible).toEqual(before)
      const empty = Array(81).fill(0)
      expect(isValidSolution(empty, solveDlx(empty))).toBe(true)
    }
  })

  test('rejects malformed givens before touching the shared matrix', () => {
    const [puzzle, solution] = EASY[0]
    const invalid = [
      null,
      [],
      Array(80).fill(0),
      Array(82).fill(0),
      ...[-1, 10, 1.5, NaN, undefined, '1'].map((digit) => [digit, ...Array(80).fill(0)])
    ]
    for (const grid of invalid) {
      expect(solveDlx(grid)).toBeNull()
      expect(solveDlx(toGrid(puzzle)).join('')).toBe(solution)
    }
  })
})

describe('sudoku5 incremental state', () => {
  test('rejects an unsatisfiable grid without duplicate givens or initially empty candidate sets', () => {
    const grid = toGrid('300000012000000003002300400001800005060070800000009000008500000900040500470006000')
    const before = [...grid]
    expect(solveDlx(grid)).toBeNull()
    expect(solve5(grid)).toBeNull()
    expect(grid).toEqual(before)
    const [puzzle, solution] = HARD[0]
    expect(solve5(toGrid(puzzle)).join('')).toBe(solution)
  })

  test('agrees with exact cover on seeded partial grids and perturbed givens', () => {
    let seed = 123456789
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32
    for (let trial = 0; trial < 32; trial++) {
      const grid = toGrid(EASY[trial % EASY.length][1]).map((digit) => (random() < 0.6 ? 0 : digit))
      if (trial % 2) grid[Math.floor(random() * 81)] = 1 + Math.floor(random() * 9)
      const before = [...grid]
      const reference = solveDlx(grid)
      const result = solve5(grid)
      // Partial grids may have multiple solutions; compare validity, not solution order.
      if (reference === null) expect(result).toBeNull()
      else expect(isValidSolution(grid, result)).toBe(true)
      expect(grid).toEqual(before)
    }
  })
})
