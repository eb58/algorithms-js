// JavaScript's bitwise operators use signed 32-bit integers. Two 30-bit words
// represent the 60 cells without touching the sign bit or losing precision.
const WORD_BITS = 30
const FULL_WORD = (1 << WORD_BITS) - 1
const masks = Array.from({ length: 60 }, (_, cell) => (cell < WORD_BITS ? [1 << cell, 0] : [0, 1 << (cell - WORD_BITS)]))

const boundaryMask = (predicate) =>
  masks.reduce(
    ([low, high], [cellLow, cellHigh], cell) =>
      predicate(cell % 3, Math.floor(cell / 3) % 4, Math.floor(cell / 12)) ? [low | cellLow, high | cellHigh] : [low, high],
    [0, 0]
  )

const [X0L, X0H] = boundaryMask((x) => x === 0)
const [X2L, X2H] = boundaryMask((x) => x === 2)
const [Y0L, Y0H] = boundaryMask((_, y) => y === 0)
const [Y3L, Y3H] = boundaryMask((_, y) => y === 3)
const [Z0L, Z0H] = boundaryMask((_, __, z) => z === 0)
const [Z4L, Z4H] = boundaryMask((_, __, z) => z === 4)

const encodePlacement = ({ cells, piece }) => ({
  cells,
  low: cells.reduce((mask, cell) => mask | masks[cell][0], 0),
  high: cells.reduce((mask, cell) => mask | masks[cell][1], 0),
  pieceBit: 1 << piece,
  first: Math.min(...cells),
  last: Math.max(...cells)
})

const overlaps = (low, high, placement) => !!(low & placement.low || high & placement.high)

const firstFreeCell = (low, high, backwards) => {
  const useHigh = backwards ? high !== FULL_WORD : low === FULL_WORD
  const word = useHigh ? high : low
  const free = ~word & FULL_WORD
  return (useHigh ? WORD_BITS : 0) + 31 - Math.clz32(backwards ? free : free & -free)
}

// An empty cell cannot be filled when every neighbor is occupied or a wall.
// Shifting the occupied cells aligns each neighbor direction with that cell.
const hasIsolatedEmptyCell = (low, high) => {
  const emptyLow = ~low & FULL_WORD
  const leftBlockedLow = (low << 1) | X0L
  const rightBlockedLow = (low >>> 1) | (high << 29) | X2L
  const aboveBlockedLow = (low << 3) | Y0L
  const belowBlockedLow = (low >>> 3) | (high << 27) | Y3L
  const frontBlockedLow = (low << 12) | Z0L
  const behindBlockedLow = (low >>> 12) | (high << 18) | Z4L
  if (emptyLow & leftBlockedLow & rightBlockedLow & aboveBlockedLow & belowBlockedLow & frontBlockedLow & behindBlockedLow) return true

  const emptyHigh = ~high & FULL_WORD
  const leftBlockedHigh = (high << 1) | (low >>> 29) | X0H
  const rightBlockedHigh = (high >>> 1) | X2H
  const aboveBlockedHigh = (high << 3) | (low >>> 27) | Y0H
  const belowBlockedHigh = (high >>> 3) | Y3H
  const frontBlockedHigh = (high << 12) | (low >>> 18) | Z0H
  const behindBlockedHigh = (high >>> 12) | Z4H
  return !!(emptyHigh & leftBlockedHigh & rightBlockedHigh & aboveBlockedHigh & belowBlockedHigh & frontBlockedHigh & behindBlockedHigh)
}

module.exports = { encodePlacement, firstFreeCell, hasIsolatedEmptyCell, overlaps }
