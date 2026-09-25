const { createPlacements, createStartPairs } = require('./ct-puzzle')
const { availableParallelism } = require('node:os')
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads')

const WORD_BITS = 30
const FULL_WORD = (1 << WORD_BITS) - 1
const ALL_PIECES = (1 << 12) - 1
const CROSS_PIECE = 10
const CROSS_BIT = 1 << CROSS_PIECE
const T12_BIT = 1 << 11
const { perPiece } = createPlacements({ canonicalT12: false })

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

const encode = ({ cells, pieceBit }) => {
  const low = cells.reduce((mask, cell) => mask | masks[cell][0], 0)
  const high = cells.reduce((mask, cell) => mask | masks[cell][1], 0)
  return { cells, low, high, pieceBit, first: Math.min(...cells), last: Math.max(...cells) }
}

const placements = perPiece.slice(0, CROSS_PIECE).flat().map(encode)
const starts = createStartPairs().map(({ cross, t12 }) => ({ cross: encode(cross), t12: encode(t12) }))
const crossCount = new Set(
  starts.map(({ cross }) =>
    cross.cells
      .slice()
      .sort((a, b) => a - b)
      .join(',')
  )
).size

const hasSingleCellHole = (low, high) => {
  const holeLow =
    ~low &
    FULL_WORD &
    ((low << 1) | X0L) &
    ((low >>> 1) | (high << 29) | X2L) &
    ((low << 3) | Y0L) &
    ((low >>> 3) | (high << 27) | Y3L) &
    ((low << 12) | Z0L) &
    ((low >>> 12) | (high << 18) | Z4L)
  if (holeLow) return true
  return !!(
    ~high &
    FULL_WORD &
    ((high << 1) | (low >>> 29) | X0H) &
    ((high >>> 1) | X2H) &
    ((high << 3) | (low >>> 27) | Y0H) &
    ((high >>> 3) | Y3H) &
    ((high << 12) | (low >>> 18) | Z0H) &
    ((high >>> 12) | Z4H)
  )
}

// Inspired by puzzle.cpp: pre-place the symmetric cross, restrict the remaining
// rotations, index placements by their first/last cell, and reject small holes.
const solveInspired = (indices, { direction = 'forward', holeCheck = true } = {}) => {
  const selected = indices || starts.map((_, index) => index)
  return selected.reduce((total, index) => {
    const start = starts[index]
    if (!start) throw new RangeError(`Unknown start placement: ${index}`)
    const { cross, t12 } = start
    const startLow = cross.low | t12.low
    const startHigh = cross.high | t12.high
    if (holeCheck && hasSingleCellHole(startLow, startHigh)) return total
    const backwards = direction === 'backward' || (direction === 'auto' && (cross.first + cross.last) / 2 >= 30)
    const byCell = Array.from({ length: 60 }, () => [])
    placements.forEach((placement) => {
      if (startLow & placement.low || startHigh & placement.high) return
      byCell[backwards ? placement.last : placement.first].push(placement)
    })

    const search = (low, high, used) => {
      if (used === ALL_PIECES) return 1
      const useHigh = backwards ? high !== FULL_WORD : low === FULL_WORD
      const word = useHigh ? high : low
      const free = ~word & FULL_WORD
      const cell = (useHigh ? WORD_BITS : 0) + 31 - Math.clz32(backwards ? free : free & -free)
      const options = byCell[cell]
      let count = 0
      for (let option = 0; option < options.length; option++) {
        const placement = options[option]
        if (used & placement.pieceBit || low & placement.low || high & placement.high) continue
        const nextLow = low | placement.low
        const nextHigh = high | placement.high
        if (holeCheck && hasSingleCellHole(nextLow, nextHigh)) continue
        count += search(nextLow, nextHigh, used | placement.pieceBit)
      }
      return count
    }

    return total + search(startLow, startHigh, CROSS_BIT | T12_BIT)
  }, 0)
}

const solveParallel = async (workerCount = availableParallelism()) => {
  const counter = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const run = () =>
    new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: { counter } })
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.once('exit', (code) => code && reject(new Error(`Worker stopped with exit code ${code}`)))
    })
  return (await Promise.all(Array.from({ length: Math.min(workerCount, starts.length) }, run))).reduce((sum, count) => sum + count, 0)
}

const main = async () => {
  const requested = Number(process.env.CT_PUZZLE_WORKERS)
  const workerCount = requested > 0 ? requested : availableParallelism()
  const started = performance.now()
  console.log(`Searching with ${workerCount} workers (C++ inspired) ...`)
  const solutions = await solveParallel(workerCount)
  console.log(`${solutions} solutions`)
  console.log(`${((performance.now() - started) / 1000).toFixed(3)} s`)
}

if (!isMainThread) {
  const counter = new Int32Array(workerData.counter)
  let count = 0
  for (;;) {
    const index = Atomics.add(counter, 0, 1)
    if (index >= starts.length) break
    count += solveInspired([index])
  }
  parentPort.postMessage(count)
} else if (require.main === module)
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })

module.exports = { crossCount, startCount: starts.length, hasSingleCellHole, solveInspired, solveParallel }
