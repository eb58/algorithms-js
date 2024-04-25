const { RANGE1_9, RANGE81, row, col, block } = require('./sudokuUtils');

const COORDROW = RANGE81.map(row)
const COORDCOL = RANGE81.map(col)
const COORDBLK = RANGE81.map(block)
const CELLSINBLK = RANGE81.reduce((acc, n) => (acc[COORDBLK[n]].push(n), acc), [[], [], [], [], [], [], [], [], []])

const setVal = (model, idx, val) => {
  model.usedInRow[COORDROW[idx]] |= 1 << val
  model.usedInCol[COORDCOL[idx]] |= 1 << val
  model.usedInBlk[COORDBLK[idx]] |= 1 << val
  model.cnt += val === 0 ? 0 : 1
  model.grid[idx] = val
  return model
}

const unsetVal = (model, idx) => {
  const val = model.grid[idx]
  model.usedInRow[COORDROW[idx]] &= ~(1 << val)
  model.usedInCol[COORDCOL[idx]] &= ~(1 << val)
  model.usedInBlk[COORDBLK[idx]] &= ~(1 << val)
  model.cnt--
  model.grid[idx] = 0
  return model
}

const countBits = (bs) => RANGE1_9.reduce((cnt, v) => cnt + (bs & (1 << v) ? 1 : 0), 0)

const getCandidates = (model, idx) => {
  const candidatesAsBitset = ~(model.usedInRow[COORDROW[idx]] | model.usedInCol[COORDCOL[idx]] | model.usedInBlk[COORDBLK[idx]])
  return { cnt: countBits(candidatesAsBitset), vals: candidatesAsBitset }
}

const getBestCell = (model) => {
  model.cands = []
  const grid = model.grid
  for (let idx = 0; idx < 81; idx++) {
    if (grid[idx] > 0) continue;
    const cands = getCandidates(model, idx)
    if (cands.cnt === 1) return { idx, cands }
    model.cands[idx] = cands
  }

  let bestIdx = -1
  for (let idx = 0; idx < 81; idx++) {
    if (grid[idx] > 0) continue;
    if (model.cands[idx] && bestIdx < 0) bestIdx = idx
    if (model.cands[idx].cnt < model.cands[bestIdx].cnt) bestIdx = idx
  }
  return bestIdx >= 0 ? { idx: bestIdx, cands: model.cands[bestIdx] } : null
}

const findHS = (m) => { // find hidden single - without this: ~500 ms for the hard ones
  for (let v = 1; v <= 9; v++) {
    const val = 1 << v
    for (let n = 0; n < 9; n++) {
      let cnt = 0, idx = -1
      for (const cell of CELLSINBLK[n]) {
        const cands = m.cands[cell]
        if (cands?.vals & val) {
          if (++cnt > 1) break
          idx = cell
        }
      }
      if (cnt === 1) return { idx, cands: { cnt: 1, vals: val } }
    }
  }
  return null
}

const solve3 = (grid) => { // ~200 ms for hard ones
  const solve = (m) => {
    let bestCell = getBestCell(m)
    if (bestCell?.cands.cnt === 0) return
    bestCell = bestCell?.cands.cnt === 1 ? bestCell : findHS(m) || bestCell
    for (let i = 1; i <= 9; i++) {
      if (bestCell?.cands.vals & (1 << i)) {
        setVal(m, bestCell.idx, i)
        solve(m)
        if (m.cnt === 81) return m.grid
        unsetVal(m, bestCell.idx)
      }
    }
  }
  const model = grid.reduce((m, val, idx) => setVal(m, idx, val), {
    cnt: 0,
    grid,
    usedInRow: [],
    usedInCol: [],
    usedInBlk: [],
  })
  return solve(model)
}

module.exports = solve3
