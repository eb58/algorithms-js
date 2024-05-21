const { matrix, ol } = require('../src/ol/ol');
const { shuffle, range } = ol;
const { reshape, redim, transpose, translate, rotateN90, makeQuadratic } = matrix;

const solve = require('../src/exact-cover');

test('exactCover 1', () => {
  const constraints = [
    [1, 0, 0, 1],
    [1, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 1],
    [0, 0, 1, 0],
  ];
  expect(solve(constraints)).toEqual([
    [0, 2],
    [0, 3, 5],
    [1, 3, 4],
  ]);
});

test('exactCover 2', () => {
  const constraints = [
    [1, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 1],
    [0, 0, 1, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 0, 1],
  ];
  expect(solve(constraints)).toEqual([[1, 3, 4]]);
});

test('exactCover 3', () => {
  const createConstraintsForPermutations = (N) => {
    // N = 2
    // ->
    // [
    // '1 0 1 0',
    // '1 0 0 1',
    // '0 1 1 0',
    // '0 1 0 1'
    // ]

    const constraints = reshape(
      range(N * N * N * 2).map(() => 0),
      2 * N,
    );

    for (let r1 = 0; r1 < N; r1++) {
      for (let r2 = 0; r2 < N; r2++) {
        for (let c = 0; c < N; c++) {
          constraints[r1 * N + r2][c] = c === r1 ? 1 : 0;
          constraints[r1 * N + r2][c + N] = c === r2 ? 1 : 0;
        }
      }
    }
    const ret = constraints;
    console.log(ret.length, ret[0].length);
    return ret;
  };

  // expect(solve(createConstraintsForPermutations(2))).toEqual([[0, 3],[1, 2]]);
  expect(solve(createConstraintsForPermutations(3))).toEqual([
    [0, 4, 8],
    [0, 5, 7],
    [1, 3, 8],
    [1, 5, 6],
    [2, 3, 7],
    [2, 4, 6],
  ]);
  // expect(solve(createConstraintsForPermutations(4)).length).toBe(24);
  // expect(solve(createConstraintsForPermutations(5)).length).toBe(120);
  // expect(solve(createConstraintsForPermutations(6)).length).toBe(720);
  expect(solve(createConstraintsForPermutations(7)).length).toBe(5040);
  // expect(solve(createConstraintsForPermutations(8)).length).toBe(40320);
  // expect(solve(createConstraintsForPermutations(15,20)).length).toBe(20);
  // expect(solve(createConstraintsForPermutations(50), 20).length).toBe(20);
});
