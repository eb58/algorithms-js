const range = (n) => [...Array(n).keys()]
const feedX = (x, f) => f(x)

const fieldString = (fld) => fld.reduce((acc, x, idx) => acc + (x === 0 ? " " : x) + ((idx + 1) % 9 === 0 ? "\n" : " "), "")

const RANGE81 = range(9 * 9)
const RANGE1_9 = range(9).map(x => x + 1)

const col = (x) => x % 9
const row = (x) => Math.floor(x / 9)
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3)
const isCandidate = (fld, idx, val) => CONNECTIONSETS[idx].every(n => fld[n] !== val)
const candidates = (fld, idx) => fld[idx] == 0 ? RANGE1_9.filter(val => isCandidate(fld, idx, val)) : undefined
const idxOfFirstEmptyCell = (fld) => fld.findIndex(x => x === 0)

const CONNECTIONSETS = (() => {
  const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y)
  const connectionSet = (x) => RANGE81.reduce((acc, y) => (inSameConnectionSet(x, y) ? [...acc, y] : acc), [])
  return RANGE81.map(connectionSet)
})()

const solve1 = (fld) => feedX( // ~55 sec for hard ones
  idxOfFirstEmptyCell(fld),
  (idx) => idx < 0 ? fld : candidates(fld, idx).reduce((res, val) => res || solve1(fld.with(idx, val)), null)
)

const solve2 = (fld) => { // ~1500 ms for hard ones
  const candidatesForField = [];
  RANGE81.some(idx => (candidatesForField[idx] = candidates(fld, idx), candidatesForField[idx]?.length === 1))
  const bestIdx = candidatesForField.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForField[res].length) ? idx : res, -100)
  return bestIdx < 0 ? fld : candidatesForField[bestIdx].reduce((res, val) => res || solve2(fld.with(bestIdx, val)), null)
}

//********************************* Solve 3 *******************************/
const COORDROW = RANGE81.map(row)
const COORDCOL = RANGE81.map(col)
const COORDBLK = RANGE81.map(block)
const CELLSINROW = RANGE81.reduce((acc, n) => (acc[COORDROW[n]].push(n), acc), [[], [], [], [], [], [], [], [], []])
const CELLSINCOL = RANGE81.reduce((acc, n) => (acc[COORDCOL[n]].push(n), acc), [[], [], [], [], [], [], [], [], []])
const CELLSINBLK = RANGE81.reduce((acc, n) => (acc[COORDBLK[n]].push(n), acc), [[], [], [], [], [], [], [], [], []])

const setVal = (model, idx, val) => {
  model.usedInRow[COORDROW[idx]] |= 1 << val
  model.usedInCol[COORDCOL[idx]] |= 1 << val
  model.usedInBlk[COORDBLK[idx]] |= 1 << val
  model.cnt += val === 0 ? 0 : 1
  model.fld[idx] = val
  return model
}

const unsetVal = (model, idx) => {
  const val = model.fld[idx]
  model.usedInRow[COORDROW[idx]] &= ~(1 << val)
  model.usedInCol[COORDCOL[idx]] &= ~(1 << val)
  model.usedInBlk[COORDBLK[idx]] &= ~(1 << val)
  model.cnt--
  model.fld[idx] = 0
  return model
}

const countBits = (bs) => RANGE1_9.reduce((cnt, v) => cnt + (bs & (1 << v) ? 1 : 0), 0)

const getCandidates = (model, idx) => {
  const candidatesAsBitset = ~(model.usedInRow[COORDROW[idx]] | model.usedInCol[COORDCOL[idx]] | model.usedInBlk[COORDBLK[idx]])
  return { cnt: countBits(candidatesAsBitset), vals: candidatesAsBitset }
}

const getBestCell = (model) => {
  model.cands = []
  const fld = model.fld
  for (let idx = 0; idx < 81; idx++) {
    if (fld[idx] > 0) continue;
    const cands = getCandidates(model, idx)
    if (cands.cnt === 1) return { idx, cands }
    model.cands[idx] = cands
  }

  let bestIdx = -1
  for (let idx = 0; idx < 81; idx++) {
    if (fld[idx] > 0) continue;
    if (model.cands[idx] && bestIdx < 0) bestIdx = idx
    if (model.cands[idx].cnt < model.cands[bestIdx].cnt) bestIdx = idx
  }
  return bestIdx >= 0 ? { idx: bestIdx, cands: model.cands[bestIdx] } : null
}

const findHN = (m, CELLS) => { // find hidden naked
  for (let v = 1; v <= 9; v++) {
    const vals = 1 << v
    for (let n = 0; n < 9; n++) {
      let cnt = 0, idx = -1
      for (const cell of CELLS[n]) {
        const cands = m.cands[cell]
        if (cands?.vals & vals) {
          if (++cnt > 1) break
          idx = cell
        }
      }
      if (cnt === 1) return { idx, cands: { cnt, vals } }
    }
  }
  return null
}

const solve3 = (fld) => { // ~200ms for hard ones
  const solve = (m) => {
    let bestCell = getBestCell(m)
    bestCell = bestCell?.cands.cnt <= 1 ? bestCell : findHN(m, CELLSINBLK) || findHN(m, CELLSINROW) || findHN(m, CELLSINCOL) || bestCell
    for (let i = 1; i <= 9; i++) {
      if (bestCell?.cands.vals & (1 << i)) {
        setVal(m, bestCell.idx, i)
        solve(m)
        if (m.cnt === 81) return m.fld
        unsetVal(m, bestCell.idx)
      }
    }
  }
  const model = fld.reduce((m, val, idx) => setVal(m, idx, val), {
    cnt: 0,
    fld,
    usedInRow: [],
    usedInCol: [],
    usedInBlk: [],
  })
  return solve(model)
}

//********************************************************************************* */

const solveExperiment1 = (fld) => {
  const candidatesForField = RANGE81.map((idx) => candidates(fld, idx))
  const bestIdx = candidatesForField.reduce((bestIdx, c, idx) => c && (bestIdx === -100 || c.length < candidatesForField[bestIdx].length) ? idx : bestIdx, -100)

  if (bestIdx < 0) return fld;

  if (candidatesForField[bestIdx].length === 1) {
    return solveExperiment1(fld.with(bestIdx, candidatesForField[bestIdx][0]))
  }

  // // find hidden naked for blocks  :-( -> das macht es nur langsamer!!!
  // const res = range(9).reduce((res, blockNumber) => {
  //   if( res ) return res;
  //   const counter = range(9).map(() => 0)
  //   CELLSINBLK[blockNumber].forEach(cell => range(9).forEach(digit => counter[digit] += candidatesForField[cell]?.includes(digit + 1) ? 1 : 0))
  //   const x = counter.findIndex(x => x === 1)
  //   const cell = CELLSINBLK[blockNumber].find(cellIdx => candidatesForField[cellIdx]?.includes(x + 1))
  //   if (cell >= 0) {
  //     const val = x + 1
  //     // console.log("AAAAAAAA", blockNumber, val, cell, counter, candidatesForField[cell])
  //     return res || { cell, val }
  //   }
  // }, null)
  // if (res) {
  //   // console.log( "XXXX", res )
  //   return solve3(fld.with(res.cell, res.val))
  // }

  return candidatesForField[bestIdx].reduce((x, val) => x || solveExperiment1(fld.with(bestIdx, val)), null)
}


const conv2Arr = s => s.split('').map(x => x === '.' ? 0 : Number(x));
const mysolve = xs => solve3(conv2Arr(xs)).join('');
// mysolve('.914.7..8.74.3.....8..2.9...2..4...6...2..5..8..5....1.37.1..5241...93..6.8......')

mysolve('...7..62.4...9..5...9..8.7..9..8.74.....6.....25.7..3..4.6..2...6..5...4.13..9...')
module.exports = { solve1, solve2, solve3 }
