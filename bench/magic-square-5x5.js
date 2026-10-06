const { performance } = require('node:perf_hooks')
const { magic5x5Solver } = require('../src/magic-square/magic-square-5x5')
const { magic5x5CountParallel } = require('../src/magic-square/magic-square-5x5-parallel')

// Default: a subspace that runs in well under a second.
// --full counts all 275,305,224 squares on all cores, --full --serial on one core (several minutes).
const full = process.argv.includes('--full')
const serial = process.argv.includes('--serial')
const expected = 275305224

const report = (byCenter, total, start) => {
  for (const [center, count] of Object.entries(byCenter)) console.log(`center ${String(center).padStart(2)}  ${String(count).padStart(10)}`)
  console.log(`total     ${total}  (expected ${expected}${total === expected ? ', ok' : ', MISMATCH'})  ${((performance.now() - start) / 1000).toFixed(1)} s`)
}

if (full && serial) {
  const start = performance.now()
  const byCenter = {}
  let total = 0
  for (let center = 1; center <= 25; center++) {
    byCenter[center] = magic5x5Solver({ center })
    total += byCenter[center]
  }
  report(byCenter, total, start)
} else if (full) {
  const start = performance.now()
  magic5x5CountParallel().then(({ total, byCenter }) => report(byCenter, total, start))
} else {
  const subspace = { center: 13, topLeft: 12 }
  for (let run = 0; run < 3; run++) magic5x5Solver(subspace)

  const times = []
  let count = 0
  for (let run = 0; run < 7; run++) {
    const start = performance.now()
    count = magic5x5Solver(subspace)
    times.push(performance.now() - start)
  }
  times.sort((left, right) => left - right)
  const median = times[3]
  console.log(`magic5x5Solver center 13, top left 12: ${count} squares, median ${median.toFixed(0)} ms (${Math.round(count / median)}k squares/s)`)
}
