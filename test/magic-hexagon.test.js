const magicHexagon = require('../src/magic-hexagon/magic-hexagon')

const sum = (xs) => xs.reduce((a, b) => a + b, 0)
const hex = magicHexagon(3)
const allLinesAreMagic = (board) => hex.lines.every((line) => sum(line.map((i) => board[i])) === hex.MN)

test('magic-hexagon-3 geometry', () => {
  expect(hex.cells.length).toBe(19)
  expect(hex.lines.length).toBe(15)
  expect(hex.corners).toEqual([0, 2, 7, 11, 16, 18])
  expect(hex.MN).toBe(38)
})

test('magic-hexagon-3 has exactly one solution', () => {
  const solutions = hex.solve()
  expect(solutions.length).toBe(1)
  expect([...solutions[0]].sort((a, b) => a - b)).toEqual([...Array(19).keys()].map((x) => x + 1))
  expect(allLinesAreMagic(solutions[0])).toBe(true)
})

test('magic-hexagon-3 has 12 solutions with symmetries', () => {
  const solutions = hex.solve(true)
  expect(solutions.length).toBe(12)
  expect(solutions.every(allLinesAreMagic)).toBe(true)
})

test('magic-hexagon-3 accepts the board from the photo', () => {
  const photo = [9, 11, 18, 14, 6, 1, 17, 15, 8, 5, 7, 3, 13, 4, 2, 19, 10, 12, 16]
  expect(allLinesAreMagic(photo)).toBe(true)
})

test('magic-hexagon exists only for order 1 and 3', () => {
  expect(magicHexagon(1).solve().length).toBe(1)
  expect(magicHexagon(2).solve().length).toBe(0)
})
