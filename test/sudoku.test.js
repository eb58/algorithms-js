const solve1 = require('../src/sudoku/sudoku1');
const solve2 = require('../src/sudoku/sudoku2');
const solve3 = require('../src/sudoku/sudoku3');
const solveDlx1 = require('../src/sudoku/sudokuDlx1');
const { EASY, HARD, toGrid } = require('../src/sudoku/sudokuPuzzles');

// Timings of all solvers: npm run benchmark:sudoku
const solve = solveDlx1;

// sudoku1 and sudoku2 are slow on the hard puzzles, run those only once
const N = solve === solve1 || solve === solve2 ? 1 : 10;
const range = (n) => [...Array(n).keys()];
const mysolve = (s) => solve(toGrid(s)).join('');

test('sudoku easy ones short', () => {
    const [puzzle, solution] = EASY[4];
    expect(mysolve(puzzle)).toEqual(solution);
});

test('sudoku easy ones', () => {
    EASY.forEach(([puzzle, solution]) => expect(mysolve(puzzle)).toEqual(solution));
});

test('sudoku hard ones', () => range(N).forEach(() => {
    HARD.forEach(([puzzle, solution]) => expect(mysolve(puzzle)).toEqual(solution));
}));
