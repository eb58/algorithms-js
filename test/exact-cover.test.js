const exactCover = require('../src/exact-cover');

const problem1 = [
  [1, 0, 0, 0],
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [0, 0, 1, 1],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
];
const problem2 = [
    [0, 0, 1, 0, 1, 1, 0],
    [1, 0, 0, 1, 0, 0, 1],
    [0, 1, 1, 0, 0, 1, 0],
    [1, 0, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 1, 1, 0, 1],
    [0, 0, 0, 1, 1, 0, 1],
];

test('exactCover 1', () => {
 expect(exactCover.solve(problem1)).toEqual([[0, 3, 4], [1, 2], [2, 4, 5]])
})

test('exactCover 2', () => {
    expect(exactCover.solve(problem2)).toEqual([[0, 3, 4]])
 })