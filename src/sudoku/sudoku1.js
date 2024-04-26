const { feedX, candidates } = require('./sudokuUtils');
const idxOfFirstEmptyCell = (grid) => grid.findIndex(x => x === 0)

const solve1 = (grid) => feedX( // ~55000 ms for hard ones
    idxOfFirstEmptyCell(grid),
    (idx) => idx < 0 ? grid : candidates(grid, idx).reduce((res, val) => res || solve1(grid.with(idx, val)), null)
)


module.exports = solve1