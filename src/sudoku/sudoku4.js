const { RANGE81, row, col, block } = require('./sudokuUtils')

// sudoku3's bitmask idea, extended:
// - every forced move is made before branching: naked singles (a cell with one candidate) and
//   hidden singles (a digit with one place) in all 27 units, repeated until nothing changes
// - no allocation while searching: typed arrays, a trail of placed cells for undo
// Digit d (1..9) is bit d-1 of a 9-bit mask.

const ALL = 0x1ff
const ROW = Int8Array.from(RANGE81, row)
const COL = Int8Array.from(RANGE81, col)
const BOX = Int8Array.from(RANGE81, block)
// the 9 cells of every row, column and box, unit u at UNITS[9u .. 9u+8]
const UNITS = Int8Array.from([
  ...[...RANGE81].sort((a, b) => row(a) - row(b) || a - b),
  ...[...RANGE81].sort((a, b) => col(a) - col(b) || a - b),
  ...[...RANGE81].sort((a, b) => block(a) - block(b) || a - b)
])
const POPCOUNT = Uint8Array.from({ length: 512 }, (_, m) => m.toString(2).replace(/0/g, '').length)
const digitOf = (bit) => 32 - Math.clz32(bit) // single bit -> digit 1..9

// search state, set up by solve4 (module-level for speed; solve4 saves and restores it,
// so a nested call, e.g. from a future callback, cannot corrupt a running search)
let grid, rowUsed, colUsed, boxUsed, trail, trailLength

const candidates = (idx) => ALL & ~(rowUsed[ROW[idx]] | colUsed[COL[idx]] | boxUsed[BOX[idx]])

const place = (idx, digit) => {
  const bit = 1 << (digit - 1)
  grid[idx] = digit
  rowUsed[ROW[idx]] |= bit
  colUsed[COL[idx]] |= bit
  boxUsed[BOX[idx]] |= bit
  trail[trailLength++] = idx
}

const undoTo = (mark) => {
  while (trailLength > mark) {
    const idx = trail[--trailLength]
    const keep = ~(1 << (grid[idx] - 1))
    rowUsed[ROW[idx]] &= keep
    colUsed[COL[idx]] &= keep
    boxUsed[BOX[idx]] &= keep
    grid[idx] = 0
  }
}

// Makes all forced moves. Returns -1 on a contradiction, 81 when the grid is full,
// DIGIT_BRANCH when a digit with exactly two places in a unit (pairUnit, pairBit) is a better
// branch than every cell, otherwise the empty cell with the fewest candidates.
const DIGIT_BRANCH = -2
let pairUnit = -1
let pairBit = 0
const propagate = () => {
  for (;;) {
    let changed = false
    let best = 81
    let bestCount = 10
    pairUnit = -1
    for (let idx = 0; idx < 81; idx++) {
      if (grid[idx]) continue
      const mask = candidates(idx)
      const count = POPCOUNT[mask]
      if (count === 0) return -1
      if (count === 1) {
        place(idx, digitOf(mask))
        changed = true
      } else if (count < bestCount) {
        bestCount = count
        best = idx
      }
    }
    for (let unit = 0; unit < 243; unit += 9) {
      // once / twice / thrice: digits possible in at least one / two / three empty cells
      let once = 0
      let twice = 0
      let thrice = 0
      let placed = 0
      for (let k = unit; k < unit + 9; k++) {
        const idx = UNITS[k]
        if (grid[idx]) {
          placed |= 1 << (grid[idx] - 1)
          continue
        }
        const mask = candidates(idx)
        thrice |= twice & mask
        twice |= once & mask
        once |= mask
      }
      if ((once | placed) !== ALL) return -1 // a digit has no place left in this unit
      const exactlyTwo = twice & ~thrice
      if (exactlyTwo && pairUnit < 0) {
        pairUnit = unit
        pairBit = exactlyTwo & -exactlyTwo
      }
      for (let hidden = once & ~twice & ~placed; hidden; hidden &= hidden - 1) {
        const bit = hidden & -hidden
        for (let k = unit; k < unit + 9; k++) {
          const idx = UNITS[k]
          // re-checked: earlier placements of this round may have taken the place
          if (!grid[idx] && candidates(idx) & bit) {
            place(idx, digitOf(bit))
            changed = true
            break
          }
        }
      }
    }
    if (!changed) return bestCount > 2 && pairUnit >= 0 ? DIGIT_BRANCH : best
  }
}

const search = () => {
  const mark = trailLength
  const best = propagate()
  if (best === 81) return true
  if (best === DIGIT_BRANCH) {
    // try both places of the digit (read before recursing, which changes pairUnit/pairBit)
    const unit = pairUnit
    const bit = pairBit
    for (let k = unit; k < unit + 9; k++) {
      const idx = UNITS[k]
      if (grid[idx] || !(candidates(idx) & bit)) continue
      const tried = trailLength
      place(idx, digitOf(bit))
      if (search()) return true
      undoTo(tried)
    }
  } else if (best >= 0) {
    for (let mask = candidates(best); mask; mask &= mask - 1) {
      const tried = trailLength
      place(best, digitOf(mask & -mask))
      if (search()) return true
      undoTo(tried)
    }
  }
  undoTo(mark)
  return false
}

// grid: 81 numbers 0..9, 0 = empty cell. Returns a new, solved grid, or null if there is no solution.
const solve4 = (input) => {
  const outer = [grid, rowUsed, colUsed, boxUsed, trail, trailLength, pairUnit, pairBit]
  try {
    grid = new Int8Array(81)
    rowUsed = new Int16Array(9)
    colUsed = new Int16Array(9)
    boxUsed = new Int16Array(9)
    trail = new Int8Array(81)
    trailLength = 0
    for (let idx = 0; idx < 81; idx++) {
      const digit = input[idx]
      if (!digit) continue
      if (!(candidates(idx) & (1 << (digit - 1)))) return null // the same given twice in a unit
      place(idx, digit)
    }
    return search() ? Array.from(grid) : null
  } finally {
    ;[grid, rowUsed, colUsed, boxUsed, trail, trailLength, pairUnit, pairBit] = outer
  }
}

module.exports = solve4
