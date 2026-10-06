const ms = require('../src/magic-square/magic-square')
const msSimple = require('../src/magic-square/magic-square-simple')
const { magic5x5Solver } = require('../src/magic-square/magic-square-5x5')
const { magic5x5CountParallel } = require('../src/magic-square/magic-square-5x5-parallel')

const expectMagicSquare = (square, size) => {
  const expectedNumbers = Array.from({ length: size * size }, (_, index) => index + 1)
  const magicNumber = expectedNumbers.reduce((total, number) => total + number, 0) / size
  const sum = (numbers) => numbers.reduce((total, number) => total + number, 0)

  expect(square).toHaveLength(size * size)
  expect([...square].sort((a, b) => a - b)).toEqual(expectedNumbers)

  for (let row = 0; row < size; row++) {
    expect(sum(square.slice(row * size, (row + 1) * size))).toBe(magicNumber)
  }

  for (let column = 0; column < size; column++) {
    expect(sum(Array.from({ length: size }, (_, row) => square[row * size + column]))).toBe(magicNumber)
  }

  expect(sum(Array.from({ length: size }, (_, index) => square[index * size + index]))).toBe(magicNumber)
  expect(sum(Array.from({ length: size }, (_, index) => square[(index + 1) * (size - 1)]))).toBe(magicNumber)
}

const expectUniqueSquares = (squares) => {
  expect(new Set(squares.map((square) => square.join(','))).size).toBe(squares.length)
}

test('magic-square-3x3-simple', () => {
  const solver = msSimple.magicSquare3x3;
  const squares = solver([1, 2, 3, 4, 5, 6, 7, 8, 9])

  expect(squares).toHaveLength(8)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 3))
});

// All 7040 4x4 magic squares (no symmetry reduction), computed once by the simple solver.
let allSimple4x4
const allMagicSquares4x4 = () =>
  (allSimple4x4 ||= msSimple.magicSquare4x4(Array.from({ length: 16 }, (_, index) => index + 1)))

test('magic-square-4x4-simple', () => {
  const squares = allMagicSquares4x4()

  expect(squares).toHaveLength(7040)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 4))
}, 60000);

// The 8 rotations/reflections of a 4x4 square.
const symmetries4x4 = (square) => {
  const rotate = (s) => Array.from({ length: 16 }, (_, i) => s[(3 - (i % 4)) * 4 + Math.floor(i / 4)])
  const transpose = (s) => Array.from({ length: 16 }, (_, i) => s[(i % 4) * 4 + Math.floor(i / 4)])
  const result = []
  let current = square
  for (let turn = 0; turn < 4; turn++) {
    result.push(current, transpose(current))
    current = rotate(current)
  }
  return result
}
const isNormal4x4 = (s) => (s[0] === 1 && s[1] < s[4]) || s[1] === 1 || (s[5] === 1 && s[6] < s[9])

;[1, 2, 3, 4, 5].forEach((n) => test(`magic-square-4x4 ${n} returns one square per symmetry class`, () => {
  const squares = ms[`magic4x4Solver${n}`]()
  expect(squares.every(isNormal4x4)).toBe(true)

  const expanded = new Set(squares.flatMap((square) => symmetries4x4(square).map((s) => s.join(','))))
  expect(expanded.size).toBe(8 * squares.length)
  expect([...expanded].sort()).toEqual(allMagicSquares4x4().map((square) => square.join(',')).sort())
}, 60000));

test('magic-square-3x3', () => {
  const solver = ms.magic3x3Solver;
  const squares = solver()

  expect(squares).toHaveLength(8)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 3))
});

test('magic-square-4x4 1', () => {
  const solver = ms.magic4x4Solver1;
  const squares = solver()

  expect(squares).toHaveLength(880)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 4))
});

test('magic-square-4x4 2', () => {
  const solver = ms.magic4x4Solver2
  const squares = solver()

  expect(squares).toHaveLength(880)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 4))
});

test('magic-square-4x4 3', () => {
  const squares = ms.magic4x4Solver3()

  expect(squares).toHaveLength(880)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 4))
  expect(squares.map((square) => square.join(',')).sort()).toEqual(
    ms.magic4x4Solver2().map((square) => square.join(',')).sort(),
  )
});

test('magic-square-4x4 4', () => {
  const squares = ms.magic4x4Solver4()
  expect(squares).toHaveLength(880)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 4))
  expect(squares.map((square) => square.join(',')).sort()).toEqual(
    ms.magic4x4Solver3().map((square) => square.join(',')).sort(),
  )
});

test('magic-square-4x4 5', () => {
  const squares = ms.magic4x4Solver5()
  expect(squares).toHaveLength(880)
  expectUniqueSquares(squares)
  squares.forEach((square) => expectMagicSquare(square, 4))
  expect(squares.map((square) => square.join(',')).sort()).toEqual(
    ms.magic4x4Solver4().map((square) => square.join(',')).sort(),
  )
});

// The full 5x5 run (275,305,224 squares) takes minutes, so the tests use subspaces.
test('magic-square-5x5 subspace', () => {
  const squares = []
  const count = magic5x5Solver({ center: 13, topLeft: 14, visit: (square) => squares.push(square) })

  expect(count).toBe(35542)
  expect(squares).toHaveLength(count)
  expectUniqueSquares(squares)
  squares.forEach((square) => {
    expectMagicSquare(square, 5)
    // normal form: top left is the smallest corner, top right < bottom left
    expect(square[0]).toBe(14)
    expect(square[12]).toBe(13)
    expect(square[0]).toBeLessThan(Math.min(square[4], square[20], square[24]))
    expect(square[4]).toBeLessThan(square[20])
  })
});

test('magic-square-5x5 parallel count matches serial', async () => {
  const centers = [12, 13]
  const topLefts = [14, 15, 16]
  const { total, byCenter } = await magic5x5CountParallel({ centers, topLefts, threads: 4 })

  for (const center of centers) {
    const serial = topLefts.reduce((sum, topLeft) => sum + magic5x5Solver({ center, topLeft }), 0)
    expect(byCenter[center]).toBe(serial)
  }
  expect(total).toBe(byCenter[12] + byCenter[13])
  expect(byCenter[13]).toBeGreaterThan(35542) // includes the top left 14 subspace
});
