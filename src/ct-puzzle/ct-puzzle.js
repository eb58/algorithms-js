const { createPlacements, createStartPairs } = require('./ct-puzzle-dlx')
const { encodePlacement, firstFreeCell, hasIsolatedEmptyCell, overlaps } = require('./bit-board')
const { availableParallelism } = require('node:os')
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads')

const ALL_PIECES = (1 << 12) - 1
const CROSS_PIECE = 10
const CROSS_BIT = 1 << CROSS_PIECE
const T12_BIT = 1 << 11
const { perPiece } = createPlacements({ canonicalT12: false })

const placements = perPiece.slice(0, CROSS_PIECE).flat().map(encodePlacement)
const starts = createStartPairs().map(({ cross, t12 }) => ({ cross: encodePlacement(cross), t12: encodePlacement(t12) }))
const crossCount = new Set(
  starts.map(({ cross }) =>
    cross.cells
      .slice()
      .sort((a, b) => a - b)
      .join(',')
  )
).size

// Inspired by puzzle.cpp: pre-place the symmetric cross, restrict the remaining
// rotations, index placements by their first/last cell, and reject small holes.
const solve = (indices, { direction = 'forward', holeCheck = true } = {}) => {
  const selected = indices || starts.map((_, index) => index)
  return selected.reduce((total, index) => {
    const start = starts[index]
    if (!start) throw new RangeError(`Unknown start placement: ${index}`)
    const { cross, t12 } = start
    const startLow = cross.low | t12.low
    const startHigh = cross.high | t12.high
    if (holeCheck && hasIsolatedEmptyCell(startLow, startHigh)) return total
    const backwards = direction === 'backward' || (direction === 'auto' && (cross.first + cross.last) / 2 >= 30)
    const byCell = Array.from({ length: 60 }, () => [])
    placements.forEach((placement) => {
      if (overlaps(startLow, startHigh, placement)) return
      byCell[backwards ? placement.last : placement.first].push(placement)
    })

    const search = (low, high, used) => {
      if (used === ALL_PIECES) return 1
      const cell = firstFreeCell(low, high, backwards)
      const options = byCell[cell]
      let count = 0
      for (let option = 0; option < options.length; option++) {
        const placement = options[option]
        if (used & placement.pieceBit || overlaps(low, high, placement)) continue
        const nextLow = low | placement.low
        const nextHigh = high | placement.high
        if (holeCheck && hasIsolatedEmptyCell(nextLow, nextHigh)) continue
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
  console.log(`Searching with ${workerCount} workers ...`)
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
    count += solve([index])
  }
  parentPort.postMessage(count)
} else if (require.main === module)
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })

module.exports = { crossCount, startCount: starts.length, hasIsolatedEmptyCell, solve, solveParallel }
