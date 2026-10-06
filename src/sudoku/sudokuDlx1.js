const { solveSudokuDlx } = require('./sudokuUtils');
const { createDlx } = require('../dlx');

const solveSudoku = (grid) => solveSudokuDlx(grid, (rows) => createDlx(324, rows).solve({ maxsolutions: 1 }));

module.exports = solveSudoku;
