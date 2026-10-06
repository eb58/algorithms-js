const { RANGE81, row, col, block } = require('./sudokuUtils')
const { range } = require('../ol').ol

// 324 constraints, each represented by a 9-bit mask:
// 81 cells -> possible digits, then 27 units x 9 digits -> possible positions.
// Assigned cells keep their singleton masks, so an empty mask always means a contradiction.
const ALL = 0x1ff
const UNITS = RANGE81.map((idx) => [row(idx), 9 + col(idx), 18 + block(idx)])
const CELLS = range(27).map((unit) => RANGE81.filter((idx) => UNITS[idx].includes(unit)))
const PEERS = RANGE81.map((idx) => Uint8Array.from(RANGE81.filter((other) => other !== idx && UNITS[idx].some((u) => UNITS[other].includes(u)))))
const SUPPORTS = new Uint16Array(81 * 9 * 3)
const POSITIONS = new Uint16Array(81 * 3)
const OPTIONS = new Uint16Array(324 * 9)
const POPCOUNT = Uint8Array.from(range(512), (mask) => mask.toString(2).replace(/0/g, '').length)
const bitIndex = (bit) => 31 - Math.clz32(bit)

for (const idx of RANGE81) {
  for (let digit = 0; digit < 9; digit++) {
    const option = idx * 9 + digit
    OPTIONS[option] = option
    for (let k = 0; k < 3; k++) {
      const unit = UNITS[idx][k]
      const pos = CELLS[unit].indexOf(idx)
      const constraint = 81 + unit * 9 + digit
      SUPPORTS[option * 3 + k] = constraint
      POSITIONS[idx * 3 + k] = 1 << pos
      OPTIONS[constraint * 9 + pos] = option
    }
  }
}

// grid: 81 numbers 0..9, 0 = empty. Returns a new solution, or null.
const solve5 = (input) => {
  // The final 81 entries hold assigned digits as bits; all other entries are masks.
  const state = new Uint16Array(405)
  // Each of 324 masks can lose at most 8 bits before contradiction; 81 assignments.
  const trail = new Uint32Array(4096)
  let trailLength = 0
  const queue = new Uint16Array(512)
  let head = 0
  let tail = 0

  const undoTo = (mark) => {
    while (trailLength > mark) {
      const entry = trail[--trailLength]
      state[entry >>> 9] = entry & ALL
    }
  }

  const removeBit = (constraint, bit) => {
    const old = state[constraint]
    const mask = old & ~bit
    trail[trailLength++] = (constraint << 9) | old
    state[constraint] = mask
    if (!mask) return false
    if (!(mask & (mask - 1))) queue[tail++] = OPTIONS[constraint * 9 + bitIndex(mask)]
    return true
  }

  const eliminate = (idx, bit) => {
    if (!(state[idx] & bit)) return true
    if (!removeBit(idx, bit)) return false
    const offset = (idx * 9 + bitIndex(bit)) * 3
    for (let k = 0; k < 3; k++) {
      if (!removeBit(SUPPORTS[offset + k], POSITIONS[idx * 3 + k])) return false
    }
    return true
  }

  const propagate = () => {
    while (head < tail) {
      const option = queue[head++]
      const idx = Math.floor(option / 9)
      const bit = 1 << (option % 9)
      if (!(state[idx] & bit)) return false // two forced moves may contradict each other
      if (state[324 + idx]) continue
      trail[trailLength++] = (324 + idx) << 9
      state[324 + idx] = bit
      for (let rest = state[idx] & ~bit; rest; rest &= rest - 1) {
        if (!eliminate(idx, rest & -rest)) return false
      }
      for (const peer of PEERS[idx]) {
        if (!eliminate(peer, bit)) return false
      }
    }
    return true
  }

  const search = () => {
    if (!propagate()) return false
    let best = -1
    let count = 10
    // Choose the smallest choice of either digits in a cell or positions of a digit.
    for (let constraint = 0; constraint < 324; constraint++) {
      const n = POPCOUNT[state[constraint]]
      if (n > 1 && n < count) {
        best = constraint
        count = n
        if (n === 2) break
      }
    }
    if (best < 0) return true
    const mark = trailLength
    for (let mask = state[best]; mask; mask &= mask - 1) {
      head = 0
      tail = 1
      queue[0] = OPTIONS[best * 9 + bitIndex(mask & -mask)]
      if (search()) return true
      undoTo(mark)
    }
    return false
  }

  // Build the initial masks directly: givens never need to be undone.
  const used = new Uint16Array(27)
  for (const idx of RANGE81) {
    if (!input[idx]) continue
    const bit = 1 << (input[idx] - 1)
    for (const unit of UNITS[idx]) {
      if (used[unit] & bit) return null
      used[unit] |= bit
    }
    state[324 + idx] = bit
  }
  for (const idx of RANGE81) {
    const [r, c, b] = UNITS[idx]
    state[idx] = state[324 + idx] || ALL & ~(used[r] | used[c] | used[b])
    for (let mask = state[idx]; mask; mask &= mask - 1) {
      const offset = (idx * 9 + bitIndex(mask & -mask)) * 3
      for (let k = 0; k < 3; k++) state[SUPPORTS[offset + k]] |= POSITIONS[idx * 3 + k]
    }
  }
  for (let constraint = 0; constraint < 324; constraint++) {
    const mask = state[constraint]
    if (!mask) return null
    if (!(mask & (mask - 1))) queue[tail++] = OPTIONS[constraint * 9 + bitIndex(mask)]
  }
  return search() ? Array.from(state.subarray(324), (bit) => bitIndex(bit) + 1) : null
}

module.exports = solve5
