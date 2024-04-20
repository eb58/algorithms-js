const range = (n) => [...Array(n).keys()]
const feedX = (x, f) => f(x)

const col = (x) => x % 9
const row = (x) => Math.floor(x / 9)
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3)
const RANGE81 = range(9 * 9)
const RANGE1_9 = range(9).map((x) => x + 1)

const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y)
const connectionSet = (x) => RANGE81.reduce((acc, y) => (inSameConnectionSet(x, y) ? [...acc, y] : acc), [])
const isCandidate = (fld, idx, val) => !CONNECTIONSETS[idx].some((y) => fld[y] === val)
const candidates = (fld, idx) => RANGE1_9.filter((val) => isCandidate(fld, idx, val))
const idxOfFirstEmptyCell = (fld) => fld.findIndex((x) => x === 0)
const CONNECTIONSETS = RANGE81.map(connectionSet)

const solve1 = (fld) => feedX(
  idxOfFirstEmptyCell(fld),
  (idx) => idx < 0 ? fld : candidates(fld, idx).reduce((res, val) => res || solve1(fld.with(idx, val)), null)
)

const solve2 = (fld) => {
  const candidatesForField = RANGE81.map((idx) => fld[idx] <= 0 ? candidates(fld, idx) : undefined)
  const idx = candidatesForField.reduce((bestIdx, c, idx) => c && (bestIdx === -100 || c.length < candidatesForField[bestIdx].length) ? idx : bestIdx, -100)
  return idx < 0 ? fld : candidatesForField[bestIdx].reduce((x, val) => x || solve2(fld.with(idx, val)), null)
}

const solve3 = (() => {
  const COORDROW = RANGE81.map((n) => row(n))
  const COORDCOL = RANGE81.map((n) => col(n))
  const COORDBLK = RANGE81.map((n) => block(n))
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

  const countBits = (bs) => {
    let cnt = 0
    for (let v = 1; v <= 9; v++) bs & (1 << v) ? cnt++ : 0
    return cnt
  }

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

  const findHiddenNaked = (m) => {
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
    return findHN(m, CELLSINBLK) || findHN(m, CELLSINROW) || findHN(m, CELLSINCOL)
  }

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

module.exports = { solve1, solve2, solve3 }
