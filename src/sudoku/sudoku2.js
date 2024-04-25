const { CONNECTIONSETS, RANGE81, candidates, print_board } = require('./sudokuUtils');
const  min = require('../ol').ol.min;

const solve2a = (grid) => { // ~1300 ms for hard ones
    const solv = (grid, emptyCells) => {
        if (emptyCells.length === 0)
            return grid

        const candidatesForCells = [];
        emptyCells.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx].length === 1))
        const bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
        const newEmptyCells = emptyCells.filter(x => x !== bestIdx)
        return bestIdx < 0 ? grid : candidatesForCells[bestIdx].reduce((res, val) => res || solv(grid.with(bestIdx, val), newEmptyCells), null)
    }
    return solv(grid, RANGE81.filter(x => grid[x] === 0))
}

const solve2b = (grid) => { // ~800-900 ms for hard ones
    const solv = (grid, emptyCells) => {
        if (emptyCells.length === 0)
            return grid

        const candidatesForCells = [];
        emptyCells.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx].length === 1))
        let bestIdx = candidatesForCells.reduce((res, c, idx) => (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)

        const len = candidatesForCells[bestIdx].length
        if (len === 1)
            return solv(grid.with(bestIdx, candidatesForCells[bestIdx][0]), emptyCells.filter(x => x !== bestIdx))

        if (len >= 2) {
            const cands = candidatesForCells
                .map((c, idx) => ({ idx, c }))
                .filter(x => x.c?.length === len)
                .map(a => ({ ...a, cntFree: CONNECTIONSETS[a.idx].reduce((acc, n) => acc + (grid[n] !== 0), 0) }), 0)
            bestIdx = min(cands, x => x.cntFree).idx || bestIdx
        }
        const empty = emptyCells.filter(x => x !== bestIdx)
        return candidatesForCells[bestIdx].reduce((res, val) => res || solv(grid.with(bestIdx, val), empty), undefined)
    }
    return solv(grid, RANGE81.filter(cellIdx => grid[cellIdx] === 0))
}

module.exports = solve2b
