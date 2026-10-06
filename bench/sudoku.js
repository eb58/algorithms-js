const { performance } = require('node:perf_hooks')
const { EASY, HARD, toGrid } = require('../src/sudoku/sudokuPuzzles')

// Usage: node bench/sudoku.js [--solver <name>] [--slow]
//   --solver  run only one solver (sudoku1, sudoku2, sudoku3, sudoku4, sudokuDlx1)
//   --slow    let sudoku1 also solve the hard puzzles (can take minutes)
const ALL_SOLVERS = [{ name: 'sudoku1', slow: true }, { name: 'sudoku2' }, { name: 'sudoku3' }, { name: 'sudoku4' }, { name: 'sudokuDlx1' }]
const names = ALL_SOLVERS.map(({ name }) => name)

const args = process.argv.slice(2)
const slow = args.includes('--slow')
const solverArg = args.indexOf('--solver')
const only = solverArg >= 0 ? args[solverArg + 1] : null
if (solverArg >= 0 && !names.includes(only)) {
  console.error(`--solver needs one of: ${names.join(', ')}${only ? ` (got ${only})` : ''}`)
  process.exit(1)
}
const solvers = ALL_SOLVERS.filter(({ name }) => !only || name === only)

const measuredRuns = 5

const measure = (solve, puzzles) => {
  const solveAll = () => puzzles.map(([puzzle]) => solve(toGrid(puzzle)))
  const results = solveAll() // warm-up, also checked
  const wrong = results.filter((result, i) => !result || result.join('') !== puzzles[i][1]).length

  const times = []
  for (let run = 0; run < measuredRuns; run++) {
    const start = performance.now()
    solveAll()
    times.push(performance.now() - start)
  }
  times.sort((left, right) => left - right)
  return { median: times[measuredRuns >> 1], wrong }
}

const format = ({ median, wrong }, count) =>
  `${median.toFixed(1).padStart(8)} ms (${(median / count).toFixed(2).padStart(6)} ms/puzzle)${wrong ? `  ${wrong} WRONG` : ''}`

console.log(`${''.padEnd(12)}${`easy (${EASY.length})`.padEnd(32)}hard (${HARD.length})`)
for (const { name, slow: isSlow } of solvers) {
  const solve = require(`../src/sudoku/${name}`)
  const easy = format(measure(solve, EASY), EASY.length)
  const hard = isSlow && !slow ? '        skipped, use --slow' : format(measure(solve, HARD), HARD.length)
  console.log(`${name.padEnd(12)}${easy}    ${hard}`)
}
