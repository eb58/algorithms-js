const range = (n) => [...Array(n).keys()]

const RANGE81 = range(9 * 9)
const RANGE1_9 = range(9).map((x) => x + 1)
const CANDIDATES_BY_USED = range(1 << 10).map((used) => RANGE1_9.filter((val) => !(used & (1 << val))))

const col = (x) => x % 9
const row = (x) => Math.floor(x / 9)
// blocks are numbered column-wise: 0 1 2 down the left third, 3 4 5 in the middle, 6 7 8 on the right
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3)
// one pass over the neighbours collects the used digits as bits, instead of one pass per digit
const candidates = (grid, idx) => {
  if (grid[idx] !== 0) return undefined
  let used = 0
  for (const n of PEERS[idx]) used |= 1 << grid[n]
  return CANDIDATES_BY_USED[used].slice()
}

const PEERS = (() => {
  const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y)
  const connectionSet = (x) => RANGE81.filter((y) => y !== x && inSameConnectionSet(x, y))
  return RANGE81.map(connectionSet)
})()

const isValidGrid = (grid) => {
  if (!Array.isArray(grid) || grid.length !== 81) return false
  const used = new Uint16Array(27)
  for (let idx = 0; idx < 81; idx++) {
    const val = grid[idx]
    if (!Number.isInteger(val) || val < 0 || val > 9) return false
    if (val === 0) continue
    const units = [row(idx), 9 + col(idx), 18 + block(idx)]
    const bit = 1 << val
    if (units.some((unit) => used[unit] & bit)) return false
    for (const unit of units) used[unit] |= bit
  }
  return true
}

module.exports = {
  isValidGrid,
  RANGE81,
  row,
  col,
  block,
  candidates
}
