const { RANGE81, row, col, block } = require('./sudokuUtils');

const COORDROW = RANGE81.map(row)
const COORDCOL = RANGE81.map(col)
const COORDBLK = RANGE81.map(block)
const CELLSINBLK = RANGE81.reduce((acc, n) => (acc[COORDBLK[n]].push(n), acc), [[], [], [], [], [], [], [], [], []])

const setVal = (model, idx, val) => {
  model.emptyCells = model.emptyCells.filter(x => x !== idx)
  model.usedInRow[COORDROW[idx]] |= 1 << val
  model.usedInCol[COORDCOL[idx]] |= 1 << val
  model.usedInBlk[COORDBLK[idx]] |= 1 << val
  model.grid[idx] = val
  return model
}

const unsetVal = (model, idx) => {
  const val = model.grid[idx]
  model.emptyCells.push(idx)
  model.usedInRow[COORDROW[idx]] &= ~(1 << val)
  model.usedInCol[COORDCOL[idx]] &= ~(1 << val)
  model.usedInBlk[COORDBLK[idx]] &= ~(1 << val)
  model.grid[idx] = 0
  return model
}

const countBits = (bs) => {
  let cnt = 0;
  for (let v = 1; v <= 9; v++) cnt += (bs & (1 << v) ? 1 : 0)
  return cnt 
}

const getCandidates = (model, idx) => {
  const candidatesAsBitset = ~(model.usedInRow[COORDROW[idx]] | model.usedInCol[COORDCOL[idx]] | model.usedInBlk[COORDBLK[idx]])
  return { cnt: countBits(candidatesAsBitset), vals: candidatesAsBitset }
}

const getBestCell = (model) => {
  model.cands = []
  const len = model.emptyCells.length
  for (let i = 0; i < len; i++) {
    const idx = model.emptyCells[i]
    const cands = getCandidates(model, idx)
    if (cands.cnt === 1) return { idx, cands }
    model.cands[idx] = cands
  }

  let bestIdx = model.emptyCells[0]
  for (let i = 1; i < len; i++) {
    const idx = model.emptyCells[i]
    if (model.cands[idx].cnt < model.cands[bestIdx].cnt) bestIdx = idx
  }
  return bestIdx >= 0 ? { idx: bestIdx, cands: model.cands[bestIdx] } : null
}

const findHS = (m) => { // find a hidden single: a value that fits only one cell of a block
  for (let v = 1; v <= 9; v++) { // for all values 
    const val = 1 << v
    for (let b = 0; b < 9; b++) {  // for all blocks 
      if( m.usedInBlk[b] & val ) continue //  value already used in block
      let cnt = 0, idx = -1
      for (const cell of CELLSINBLK[b]) { // for every cell in block
        const cands = m.cands[cell]
        if (cands?.vals & val) {
          if (++cnt > 1) break
          idx = cell
        }
      }
      if (cnt === 1) return { idx, cands: { cnt: 1, vals: val } }
    }
  }
}

// Returns the solved grid, or null if there is no solution. The input grid is not changed.
const solve3 = (grid) => {
  // true once every cell is filled, false at a dead end (the model is restored then)
  const solve = (m) => {
    const bestCell = getBestCell(m)
    if (!bestCell) return true
    if (bestCell.cands.cnt === 0) return false
    const cell = bestCell.cands.cnt === 1 ? bestCell : findHS(m) || bestCell
    for (let i = 1; i <= 9; i++) {
      if (cell.cands.vals & (1 << i)) {
        setVal(m, cell.idx, i)
        if (solve(m)) return true
        unsetVal(m, cell.idx)
      }
    }
    return false
  }
  const model = {
    emptyCells: RANGE81.filter(x => grid[x] === 0),
    grid: [...grid],
    usedInRow: Array(9).fill(0),
    usedInCol: Array(9).fill(0),
    usedInBlk: Array(9).fill(0),
  }
  for (let idx = 0; idx < 81; idx++) {
    const val = grid[idx]
    if (val === 0) continue
    // the same number twice in a row, column or block: no search needed
    if ((model.usedInRow[COORDROW[idx]] | model.usedInCol[COORDCOL[idx]] | model.usedInBlk[COORDBLK[idx]]) & (1 << val)) return null
    setVal(model, idx, val)
  }
  return solve(model) ? model.grid : null
}

module.exports = solve3
