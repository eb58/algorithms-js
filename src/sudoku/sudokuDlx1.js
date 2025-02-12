const { solveSudokuDlx } = require('./sudokuUtils');
const dlx_solve = require('../dlx');
const solveSudoku = (grid) => solveSudokuDlx(grid, (matrix) => dlx_solve(matrix,1));

module.exports = solveSudoku;
