const solve = require('../src/exact-cover');

const cmpCond = (c1, c2) => (c1.join('') < c2.join('') ? 1 : -1)

const conditions1 = [
  [1, 0, 0, 0],
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [0, 0, 1, 1],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
].toSorted(cmpCond);

const conditions2 = [
    [0, 0, 1, 0, 1, 1, 0],
    [1, 0, 0, 1, 0, 0, 1],
    [0, 1, 1, 0, 0, 1, 0],
    [1, 0, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 1, 1, 0, 1],
    [0, 0, 0, 1, 1, 0, 1],
].toSorted(cmpCond);

test('exactCover 1', () => {
 expect(solve(conditions1)).toEqual([[ 0, 2 ], [ 0, 3, 5 ], [ 1, 3, 4 ]])
})

test('exactCover 2', () => {
  expect(solve(conditions2)).toEqual([[1, 3, 4]])
})