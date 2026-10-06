const ms = require('../src/magic-square/magic-square')
const msSimple = require('../src/magic-square/magic-square-simple')

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

// xtest('magic-square-4x4-simple', () => { // working, but very slow!!
//   const solver = msSimple.magicSquare4x4
//   expect(solver([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]).length).toBe(880);
// });

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
