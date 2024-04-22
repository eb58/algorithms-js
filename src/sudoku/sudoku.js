const range = (n) => [...Array(n).keys()]
const feedX = (x, f) => f(x)

const dumpField = (fld) => console.log(fld.reduce((acc, x, idx) => acc + (x === 0 ? " " : x) + ((idx + 1) % 9 === 0 ? "\n" : " "), ""))
const checkField = (fld) => {
  //   RANGE1_9.reduce( (acc, val)=> )
  RANGE81
}

const col = (x) => x % 9
const row = (x) => Math.floor(x / 9)
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3)
const RANGE81 = range(9 * 9)
const RANGE1_9 = range(9).map(x => x + 1)

const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y)
const connectionSet = (x) => RANGE81.reduce((acc, y) => (inSameConnectionSet(x, y) ? [...acc, y] : acc), [])
const isCandidate = (fld, idx, val) => !CONNECTIONSETS[idx].some(y => fld[y] === val)
const candidates = (fld, idx) => fld[idx] == 0 ? RANGE1_9.filter(val => isCandidate(fld, idx, val)) : undefined
const idxOfFirstEmptyCell = (fld) => fld.findIndex(x => x === 0)
const CONNECTIONSETS = RANGE81.map(connectionSet)

const solve1 = (fld) => feedX(
  idxOfFirstEmptyCell(fld),
  (idx) => idx < 0 ? fld : candidates(fld, idx).reduce((res, val) => res || solve1(fld.with(idx, val)), null)
)

const solve2 = (fld) => {
  const candidatesForField = RANGE81.map(idx => candidates(fld, idx))
  const bestIdx = candidatesForField.reduce((res, c, idx) => c && (res === -100 || c.length < candidatesForField[res].length) ? idx : res, -100)
  return bestIdx < 0 ? fld : candidatesForField[bestIdx].reduce((res, val) => res || solve2(fld.with(bestIdx, val)), null)
}

const solve3 = (fld) => {
  const candidatesForField = RANGE81.map((idx) => candidates(fld, idx))
  const bestIdx = candidatesForField.reduce((bestIdx, c, idx) => c && (bestIdx === -100 || c.length < candidatesForField[bestIdx].length) ? idx : bestIdx, -100)

  if (bestIdx < 0) return fld;

  if (candidatesForField[bestIdx].length === 1) {
    return solve3(fld.with(bestIdx, candidatesForField[bestIdx][0]))
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

  if (res) {
    // console.log( "XXXX", res )
    return solve3(fld.with(res.cell, res.val))
  }

  return candidatesForField[bestIdx].reduce((x, val) => x || solve3(fld.with(bestIdx, val)), null)
}

const solve4 = (() => {
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
  }

  const unsetVal = (model, idx) => {
    const val = model.fld[idx]
    model.usedInRow[COORDROW[idx]] &= ~(1 << val)
    model.usedInCol[COORDCOL[idx]] &= ~(1 << val)
    model.usedInBlk[COORDBLK[idx]] &= ~(1 << val)
    model.cnt--
    model.fld[idx] = 0
  }

  const countBits = (bs) => RANGE1_9.reduce((cnt, v) => cnt + (bs & (1 << v) ? 1 : 0), 0)

  const getCandidates = (model, idx) => {
    const candidatesAsBitset = ~(model.usedInRow[COORDROW[idx]] | model.usedInCol[COORDCOL[idx]] | model.usedInBlk[COORDBLK[idx]])
    return { cnt: countBits(candidatesAsBitset), vals: candidatesAsBitset }
  }

  const getBestCell = (model) => {
    let bestCell = null
    model.cand = []
    model.fld.forEach((x, idx) => {
      if (x === 0) {
        const cand = getCandidates(model, idx)
        if (!bestCell || cand.cnt < bestCell.cand.cnt) {
          bestCell = { idx, cand }
        }
        model.cand[idx] = cand
      }
    })
    return bestCell
  }

  const findHN = (m, CELLS) => {
    for (let v = 1; v <= 9; v++) {
      const mask = 1 << v
      for (let n = 0; n < 9; n++) {
        const cells = CELLS[n]
        let cnt = 0,
          idx = -1
        for (const element of cells) {
          const x = m.cand[element]
          if (x && x.vals & mask) {
            if (++cnt > 1) break
            idx = element
          }
        }
        if (cnt === 1) {
          return { idx, cand: { cnt: 1, vals: mask } }
        }
      }
    }
    return null
  }

  const findHiddenNaked = (m) => findHN(m, CELLSINBLK) || findHN(m, CELLSINROW) || findHN(m, CELLSINCOL)

  const solve = (fld) => {
    const model = {
      cnt: 0,
      fld,
      cand: [],
      usedInRow: [],
      usedInCol: [],
      usedInBlk: [],
    }

    fld.forEach((val, idx) => setVal(model, idx, val))

    let res = null
    const fill = (m) => {
      if (m.cnt === 81) {
        return (res = [...m.fld])
      }

      let bestCell = getBestCell(m)
      if (!bestCell) return
      if (bestCell.cand.cnt > 1) {
        bestCell = findHiddenNaked(m) || bestCell
      }
      for (let i = 1; i <= 9; i++) {
        if (bestCell.cand.vals & (1 << i)) {
          setVal(m, bestCell.idx, i)
          fill(m)
          if (!res) unsetVal(m, bestCell.idx)
        }
      }
    }
    fill(model)
    return res
  }
  return solve
})()

module.exports = { solve1, solve2, solve3, solve4 }
