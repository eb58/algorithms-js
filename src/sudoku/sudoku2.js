const { CONNECTIONSETS, RANGE81, candidates } = require('./sudokuUtils');
const min = require('../ol').ol.min;

const solve2a = (grid, emptyCells = RANGE81.filter(x => grid[x] === 0)) => {
    if (emptyCells.length === 0)
        return grid

    const candidatesForCells = [];
    emptyCells.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx].length === 1))
    const bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
    const newEmptyCells = emptyCells.filter(x => x !== bestIdx)
    return candidatesForCells[bestIdx].length === 1
        ? solve2a(grid.with(bestIdx, candidatesForCells[bestIdx][0]), newEmptyCells)
        : candidatesForCells[bestIdx].reduce((res, val) => res || solve2a(grid.with(bestIdx, val), newEmptyCells), null)
}

const solve2b = (grid, emptyCells = RANGE81.filter(x => grid[x] === 0)) => {
    if (emptyCells.length === 0)
        return grid

    const candidatesForCells = [];
    emptyCells.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx].length === 1))
    let bestIdx = candidatesForCells.reduce((res, c, idx) => (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
    
    const len = candidatesForCells[bestIdx].length
    if (len === 1)
        return solve2b(grid.with(bestIdx, candidatesForCells[bestIdx][0]), emptyCells.filter(x => x !== bestIdx))

    if (len >= 2) { // Das bringt fast gar nichts!!
        const candsOfFixedLength = candidatesForCells
            .map((cands, idx) => ({ idx, cands }))
            .filter(x => x.cands?.length === len)
            .map(a => ({ ...a, cntFree: CONNECTIONSETS[a.idx].reduce((acc, n) => acc + (grid[n] !== 0), 0) }), 0)
        bestIdx = min(candsOfFixedLength, x => x.cntFree).idx || bestIdx
    }
    const newEmptyCells = emptyCells.filter(x => x !== bestIdx)
    return candidatesForCells[bestIdx].reduce((res, val) => res || solve2b(grid.with(bestIdx, val), newEmptyCells), undefined)
}

module.exports = solve2a
