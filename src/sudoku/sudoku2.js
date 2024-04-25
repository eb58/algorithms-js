const { CONNECTIONSETS, RANGE81, candidates, print_board } = require('./sudokuUtils');
const min = (xs, proj) => xs.reduce((a, x) => proj(x) < proj(a) ? x : a, xs[0])

const solve2a = (grid) => { // ~1500 ms for hard ones
    const candidatesForCells = [];
    RANGE81.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx]?.length === 1))
    const bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
    return bestIdx < 0 ? grid : candidatesForCells[bestIdx].reduce((res, val) => res || solve2(grid.with(bestIdx, val)), null)
}


const solve2 = (grid) => { // ~1000 ms for hard ones
    const candidatesForCells = [];
    RANGE81.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx]?.length === 1))
    let bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)

    if (bestIdx < 0)
        return grid

    const len = candidatesForCells[bestIdx].length
    if (len === 1)
        return solve2(grid.with(bestIdx, candidatesForCells[bestIdx][0]))

    if (len >= 2) {
        const cands = candidatesForCells
            .map((c, idx) => ({ idx, c }))
            .filter(x => x.c?.length === len)
            .map(a => ({ ...a, cntFree: CONNECTIONSETS[a.idx].reduce((acc, n) => acc + (grid[n] !== 0), 0) }), 0)
        bestIdx = min(cands, x => x.cntFree).idx || bestIdx
    }
    return candidatesForCells[bestIdx].reduce((res, val) => res || solve2(grid.with(bestIdx, val)), null)
}

module.exports = solve2
