const { DancingLinkX } = require('@algorithm.ts/dlx')

const DL_TOTAL_COLUMNS = 9 * 9 * 4
const MAX_N = DL_TOTAL_COLUMNS * (9 * 9 * 9) + 10
const dlx = new DancingLinkX({ MAX_N })
const range = n => [...Array(n).keys()]

// Sudoku constraints.
const SudokuConstraint = {
    SLOT: 0, // Slot(a, b): There must be a number on the grid in row a column b
    ROW: 1, // Row(a, b): Row a must have the number b
    COL: 2, // Col(a, b): Column a must have the number b
    SUB: 3, // Sub(a, b): a-th sub-square matrix must have the number b
}

function solveSudoku(grid) {
    const encode = (a, b, c) => a * 81 + b * 9 + c + 1

    dlx.init(DL_TOTAL_COLUMNS)
    const columns = new Array(4)
    for (let r = 0; r < 9; ++r) for (let c = 0; c < 9; ++c) {
        const w = grid[r * 9 + c] - 1
        const s = Math.floor(r / 3) * 3 + Math.floor(c / 3)
        for (let v = 0; v < 9; ++v) if (w === -1 || w === v) {
            columns[0] = encode(SudokuConstraint.SLOT, r, c)

            columns[1] = encode(SudokuConstraint.ROW, r, v)
            columns[2] = encode(SudokuConstraint.COL, c, v)
            columns[3] = encode(SudokuConstraint.SUB, s, v)
            dlx.addRow(encode(r, c, v), columns)
        }
    }

    const answer = dlx.solve()
    if (answer === null) return null

    const solution = range(9).map(x => range(9).map(() => 0))
    for (const answ of answer) {
        let code = answ - 1
        const c = code % 9 + 1
        const b = Math.floor(code / 9) % 9
        const a = Math.floor(Math.floor(code / 9) / 9)

        solution[a][b] = code % 9 + 1
    }
    return solution.flat()
}

// const conv2Arr = s => s.split('').map(x => (x === '.' ? 0 : Number(x)) - 1);
// console.log(solveSudoku(conv2Arr('...7..62.4...9..5...9..8.7..9..8.74.....6.....25.7..3..4.6..2...6..5...4.13..9...')).join(""))
// console.log(solveSudoku(conv2Arr('.914.7..8.74.3.....8..2.9...2..4...6...2..5..8..5....1.37.1..5241...93..6.8......')).join(""))
// console.log(solveSudoku(conv2Arr('97........62.19.54...682...5981..6.3...896.4.14.3..9..2.4938.7...7...49868.5.72..')).join(""))

module.exports = solveSudoku
