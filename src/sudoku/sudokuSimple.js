const { RANGE81, feedX, idxOfFirstEmptyCell, candidates } = require('./sudokuUtils');

const solve1 = (grid) => feedX( // ~55000 ms for hard ones
    idxOfFirstEmptyCell(grid),
    (idx) => idx < 0 ? grid : candidates(grid, idx).reduce((res, val) => res || solve1(grid.with(idx, val)), null)
)

const solve2 = (grid) => { // ~1500 ms for hard ones
    const candidatesForCells = [];
    RANGE81.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx]?.length === 1))
    const bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
    return bestIdx < 0 ? grid : candidatesForCells[bestIdx].reduce((res, val) => res || solve2(grid.with(bestIdx, val)), null)
}