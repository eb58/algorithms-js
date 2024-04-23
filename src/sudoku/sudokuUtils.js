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

module.exports = {
  RANGE1_9,
  RANGE81,
  range,
  feedX,
  row, col, block,
  candidates,
  idxOfFirstEmptyCell
}