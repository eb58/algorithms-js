const { RANGE1_9, RANGE81, row, col, block } = require('./sudokuUtils');

const COORDROW = RANGE81.map(row)
const COORDCOL = RANGE81.map(col)
const COORDBLK = RANGE81.map(block)
const CELLSINBLK = RANGE81.reduce((acc, n) => (acc[COORDBLK[n]].push(n), acc), [[], [], [], [], [], [], [], [], []])

const setVal = (model, idx, val) => {
  model.emptyCells = val === 0 ? model.emptyCells : model.emptyCells.filter(x => x !== idx)
  model.usedInRow[COORDROW[idx]] |= 1 << val
  model.usedInCol[COORDCOL[idx]] |= 1 << val
  model.usedInBlk[COORDBLK[idx]] |= 1 << val
  model.cnt += val !== 0
  model.grid[idx] = val
  return model
}

const unsetVal = (model, idx) => {
  const val = model.grid[idx]
  model.emptyCells.push(idx)
  model.usedInRow[COORDROW[idx]] &= ~(1 << val)
  model.usedInCol[COORDCOL[idx]] &= ~(1 << val)
  model.usedInBlk[COORDBLK[idx]] &= ~(1 << val)
  model.cnt--
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

const findHS = (m) => { // find hidden single - without this: ~500 ms for the hard ones
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

const solve3 = (grid) => { // ~200 ms for hard ones
  const solve = (m) => {
    let bestCell = getBestCell(m)
    if (bestCell?.cands.cnt === 0) return
    bestCell = bestCell?.cands.cnt === 1 ? bestCell : findHS(m) || bestCell
    for (let i = 1; i <= 9; i++) {
      if (bestCell?.cands.vals & (1 << i)) {
        setVal(m, bestCell.idx, i)
        solve(m)
        if (m.emptyCells.length === 0) return m.grid
        unsetVal(m, bestCell.idx)
      }
    }
  }
  const model = grid.reduce((m, val, idx) => setVal(m, idx, val), {
    emptyCells: RANGE81.filter(x => grid[x] === 0),
    cnt: 0,
    grid,
    usedInRow: [],
    usedInCol: [],
    usedInBlk: [],
  })
  return solve(model)
}

// const conv2Arr = s => s.split('').map(x => x === '.' ? 0 : Number(x));
// console.log(solve3(conv2Arr('...7..62.4...9..5...9..8.7..9..8.74.....6.....25.7..3..4.6..2...6..5...4.13..9...')))

module.exports = solve3
