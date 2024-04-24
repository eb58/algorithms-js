const solve2 = (grid) => { // ~1500 ms for hard ones
    const candidatesForCells = [];
    RANGE81.some(idx => (candidatesForCells[idx] = candidates(grid, idx), candidatesForCells[idx]?.length === 1))
    const bestIdx = candidatesForCells.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForCells[res].length) ? idx : res, -100)
    return bestIdx < 0 ? grid : candidatesForCells[bestIdx].reduce((res, val) => res || solve2(grid.with(bestIdx, val)), null)
}