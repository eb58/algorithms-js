const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const vm = require('node:vm')
const { countSolutions, sanitizeRecognition, solve, validate } = require('../../../src/sudoku/web-app/sudoku')
const solve5 = require('../../../src/sudoku/sudoku5')

const toGrid = (value) => [...value].map((digit) => (digit === '.' ? 0 : Number(digit)))

describe('Sudoku Web-App solver', () => {
  const puzzle = toGrid('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79')
  const expected = toGrid('534678912672195348198342567859761423426853791713924856961537284287419635345286179')

  test('verwendet den gemeinsamen sudoku5-Solver', () => {
    expect(solve).toBe(solve5)
  })

  test('lädt den gemeinsamen Solver ohne CommonJS direkt im Browser', () => {
    const context = vm.createContext({})
    for (const file of ['sudokuUtils.js', 'sudoku5.js', 'web-app/sudoku.js']) {
      vm.runInContext(readFileSync(join(__dirname, '..', '..', '..', 'src', 'sudoku', file), 'utf8'), context)
    }

    expect(Array.from(context.Sudoku.solve(puzzle))).toEqual(expected)
  })

  test('solves a valid puzzle without mutating its input', () => {
    const original = puzzle.slice()

    expect(solve(puzzle)).toEqual(expected)
    expect(puzzle).toEqual(original)
  })

  test('validates shape, values and duplicate givens', () => {
    expect(validate(puzzle)).toBe(true)
    expect(validate(puzzle.slice(0, 80))).toBe(false)
    expect(validate([...puzzle.slice(0, 80), 10])).toBe(false)

    const duplicate = puzzle.slice()
    duplicate[1] = 5
    expect(validate(duplicate)).toBe(false)
  })

  test('counts solutions to detect ambiguous puzzles', () => {
    // erste Zeile und Spalte fehlen, wie nach einem schlecht gesetzten Rahmen
    const incomplete = toGrid('............3...........63...3....28....46.....8.....9....249...7...3.......6.142')

    expect(countSolutions(puzzle)).toBe(1)
    expect(countSolutions(incomplete)).toBe(2)
    expect(countSolutions(incomplete, 5)).toBe(5)
    expect(countSolutions(Array(81).fill(0))).toBe(2)
    expect(countSolutions([5, 5, ...Array(79).fill(0)])).toBe(0)
  })

  test('returns null for an invalid puzzle', () => {
    const invalid = puzzle.slice()
    invalid[1] = 5

    expect(solve(invalid)).toBeNull()
  })

  test('solves the photographed reference puzzle', () => {
    const photographedPuzzle = toGrid(
      ['5.26.....', '9..3.....', '......63.', '..3....28', '....46...', '..8.....9', '....249..', '.7...3...', '....6.142'].join('')
    )
    const photographedSolution = toGrid(
      ['532671894', '946385217', '817492635', '463159728', '729846351', '158237469', '681524973', '274913586', '395768142'].join('')
    )

    expect(validate(photographedPuzzle)).toBe(true)
    expect(solve(photographedPuzzle)).toEqual(photographedSolution)
  })

  test('solves the second photographed puzzle', () => {
    const photographedPuzzle = toGrid(
      ['1.62.7.9.', '.3....25.', '..43....6', '.8..7.96.', '61....4..', '54.681.3.', '....69.23', '8.3.15.4.', '9...3...7'].join('')
    )
    const photographedSolution = toGrid(
      ['156247398', '738196254', '294358176', '382574961', '617923485', '549681732', '471869523', '823715649', '965432817'].join('')
    )

    expect(validate(photographedPuzzle)).toBe(true)
    expect(solve(photographedPuzzle)).toEqual(photographedSolution)
  })

  test('drops the less confident value from an OCR conflict', () => {
    const recognized = toGrid(
      ['1.62.7...', '.3....2..', '..43.....', '.8..7.98.', '61....4..', '54.681.3.', '....69.23', '8.3.15.4.', '....3...7'].join('')
    )
    const confidence = Array(81).fill(90)
    confidence[3 * 9 + 7] = 42

    const sanitized = sanitizeRecognition(recognized, confidence)

    expect(sanitized.removed).toContain(3 * 9 + 7)
    expect(sanitized.grid[3 * 9 + 7]).toBe(0)
    expect(validate(sanitized.grid)).toBe(true)
    expect(solve(sanitized.grid)).not.toBeNull()
  })
})
