const { performance } = require('node:perf_hooks')
const magicSquares = require('../src/magic-square/magic-square')

const warmupRuns = 3
const measuredRuns = 15
const expectedSquares = 880

const percentile = (sortedValues, fraction) => sortedValues[Math.ceil(sortedValues.length * fraction) - 1]

const solvers = Object.entries(magicSquares)
  .filter(([name]) => /^magic4x4Solver\d+$/.test(name))
  .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))

for (const [name, solve] of solvers) {
  for (let run = 0; run < warmupRuns; run++) solve()

  const times = []
  for (let run = 0; run < measuredRuns; run++) {
    const start = performance.now()
    const squares = solve()
    times.push(performance.now() - start)
    if (squares.length !== expectedSquares) throw new Error(`${name}: expected ${expectedSquares} squares, received ${squares.length}`)
  }

  times.sort((left, right) => left - right)
  const mean = times.reduce((total, time) => total + time, 0) / times.length
  const median = percentile(times, 0.5)
  const p95 = percentile(times, 0.95)

  console.log(
    `${name.padEnd(20)} median ${median.toFixed(1).padStart(7)} ms  mean ${mean.toFixed(1).padStart(7)} ms p95 ${p95.toFixed(1).padStart(7)} ms`,
  )
}
