const { crossCount, startCount, hasSingleCellHole } = require('../src/ct-puzzle/ct-puzzle-inspired')

test('the symmetric cross yields twelve starts before the second piece is placed', () => {
  expect(crossCount).toBe(12)
  expect(startCount).toBe(1405)
})

test('bitwise hole detection agrees with an explicit neighbor check', () => {
  const full = (1 << 30) - 1
  const boards = [
    [0, 0],
    [full, full],
    ...Array.from({ length: 60 }, (_, cell) => (cell < 30 ? [full ^ (1 << cell), full] : [full, full ^ (1 << (cell - 30))])),
    ...Array.from({ length: 100 }, (_, index) => [Math.imul(index + 1, 1103515245) & full, Math.imul(index + 101, 1664525) & full])
  ]
  const occupied = (low, high, cell) => (cell < 30 ? !!(low & (1 << cell)) : !!(high & (1 << (cell - 30))))
  const reference = (low, high) =>
    Array.from({ length: 60 }, (_, cell) => cell).some((cell) => {
      if (occupied(low, high, cell)) return false
      const x = cell % 3
      const y = Math.floor(cell / 3) % 4
      const z = Math.floor(cell / 12)
      return [
        x === 0 || occupied(low, high, cell - 1),
        x === 2 || occupied(low, high, cell + 1),
        y === 0 || occupied(low, high, cell - 3),
        y === 3 || occupied(low, high, cell + 3),
        z === 0 || occupied(low, high, cell - 12),
        z === 4 || occupied(low, high, cell + 12)
      ].every(Boolean)
    })
  boards.forEach(([low, high]) => expect(hasSingleCellHole(low, high)).toBe(reference(low, high)))
})
