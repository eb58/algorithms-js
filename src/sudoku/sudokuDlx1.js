const { solveSudokuDlx } = require('./sudokuUtils');
const dlx = require('../dlx');

const solveSudoku = (grid) => solveSudokuDlx(grid, dlx);

module.exports = solveSudoku;
