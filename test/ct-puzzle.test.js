const puzzle = require('../src/ct-puzzle/ct-puzzle')

test('the pieces fill the 3 x 4 x 5 cuboid', () => {
  expect(puzzle.PIECES).toHaveLength(12)
  expect(puzzle.PIECES.map((piece) => piece.length)).toEqual([5, 5, 5, 5, 5, 5, 5, 5, 4, 5, 5, 6])
  expect(puzzle.PIECES.flat()).toHaveLength(puzzle.CELL_COUNT)
})

test('generates the 24 proper rotations without reflections', () => {
  expect(puzzle.ROTATIONS).toHaveLength(24)
})

test('keeps one quarter of the T12 placements to break cuboid symmetry', () => {
  expect(puzzle.createPlacements().perPiece[11]).toHaveLength(56)
})

test('every placement stays inside the cuboid and contains one whole piece', () => {
  const { perPiece } = puzzle.createPlacements()
  perPiece.forEach((placements, piece) =>
    placements.forEach(({ cells }) => {
      expect(cells).toHaveLength(puzzle.PIECES[piece].length)
      expect(new Set(cells).size).toBe(cells.length)
      expect(cells.every((cell) => cell >= 0 && cell < puzzle.CELL_COUNT)).toBe(true)
    })
  )
})
