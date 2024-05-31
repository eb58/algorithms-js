const { solveSudokuDlx } = require('./sudokuUtils');
const dlx = require('dancing-links');

const dlx_solve = (constraints) => dlx.findOne(constraints.map((c) => ({ row: c })));
const solveSudoku = (grid) => solveSudokuDlx(grid, dlx_solve);

module.exports = solveSudoku;
