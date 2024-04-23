const { RANGE81, feedX, idxOfFirstEmptyCell, candidates } = require('./sudokuUtils');

const solve1 = (fld) => feedX( // ~55000 ms for hard ones
    idxOfFirstEmptyCell(fld),
    (idx) => idx < 0 ? fld : candidates(fld, idx).reduce((res, val) => res || solve1(fld.with(idx, val)), null)
)

const solve2 = (fld) => { // ~1500 ms for hard ones
    const candidatesForCells = [];
    RANGE81.some(idx => (candidatesForCells[idx] = candidates(fld, idx), candidatesForCells[idx]?.length === 1))
    const bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
    return bestIdx < 0 ? fld : candidatesForCells[bestIdx].reduce((res, val) => res || solve2(fld.with(bestIdx, val)), null)
}