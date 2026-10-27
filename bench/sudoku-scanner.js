const { readdirSync } = require('node:fs')
const { join } = require('node:path')
const { performance } = require('node:perf_hooks')
const sharp = require('sharp')
const { findGrid, recognizeDigits } = require('../src/sudoku/web-app/scanner')
const { findSolutions, sanitizeRecognition } = require('../src/sudoku/web-app/sudoku')

// Usage: node bench/sudoku-scanner.js [--filter <text>] [--runs <n>]
//   --filter  only fixtures whose file name contains <text>
//   --runs    measured runs per fixture (default 5), the median is reported
// Measures the app's chain on every photo in src/sudoku/web-app/fixtures and its negative/ folder (photos without a
// recognizable grid): grid search, digit recognition and solving. Photos are decoded once beforehand and oriented like the browser shows them (EXIF rotation applied).
const FIXTURES = join(__dirname, '..', 'src', 'sudoku', 'web-app', 'fixtures')
const UNCERTAIN = 0.1 // same threshold as app.js

const args = process.argv.slice(2)
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback)
const filter = option('--filter', '')
const measuredRuns = Number(option('--runs', 5))
if (!Number.isInteger(measuredRuns) || measuredRuns < 1) {
  console.error('--runs needs a positive integer')
  process.exit(1)
}

const loadImage = async (file) => {
  const { data, info } = await sharp(join(FIXTURES, file)).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height }
}

const median = (times) => times.sort((left, right) => left - right)[times.length >> 1]

// One pass through the chain, timed per step; result is what the app would show.
const scan = (image) => {
  const start = performance.now()
  const found = findGrid(image)
  const grid = performance.now()
  if (!found) return { times: [grid - start, 0, 0], result: 'no grid' }
  const recognized = recognizeDigits(found.board)
  const digits = performance.now()
  const sanitized = sanitizeRecognition(recognized.grid, recognized.confidence)
  const solutions = findSolutions(sanitized.grid)
  const solve = performance.now()
  const uncertain = sanitized.grid.filter((value, index) => value && recognized.confidence[index] < UNCERTAIN).length
  const result = sanitized.removed.length
    ? `check: ${sanitized.removed.length} removed`
    : solutions.length !== 1
      ? `check: ${solutions.length || 'no'} solutions`
      : uncertain
        ? `solved, ${uncertain} uncertain`
        : 'solved'
  return { times: [grid - start, digits - grid, solve - digits], result }
}

const run = async () => {
  const files = ['', 'negative/']
    .flatMap((folder) => readdirSync(join(FIXTURES, folder)).map((file) => folder + file))
    .filter((file) => /\.(?:jpe?g|png|gif|webp)$/i.test(file) && file.includes(filter))
  if (!files.length) {
    console.error(`no fixtures match "${filter}"`)
    process.exit(1)
  }
  const columns = ['grid', 'digits', 'solve', 'total']
  console.log(`${'fixture'.padEnd(52)}${'size'.padEnd(11)}${columns.map((name) => name.padStart(8)).join('')}  result`)
  const totals = [0, 0, 0, 0]
  for (const file of files) {
    const image = await loadImage(file)
    const { result } = scan(image) // warm-up
    const runs = Array.from({ length: measuredRuns }, () => scan(image).times)
    const times = [0, 1, 2].map((step) => median(runs.map((time) => time[step])))
    times.push(median(runs.map((time) => time[0] + time[1] + time[2])))
    times.forEach((time, step) => (totals[step] += time))
    const name = file.length > 50 ? `${file.slice(0, 47)}...` : file
    console.log(
      `${name.padEnd(52)}${`${image.width}x${image.height}`.padEnd(11)}${times.map((time) => time.toFixed(1).padStart(8)).join('')}  ${result}`
    )
  }
  console.log(`${`total (${files.length} fixtures, ms)`.padEnd(63)}${totals.map((time) => time.toFixed(0).padStart(8)).join('')}`)
}

run()
