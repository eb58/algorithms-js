const CHAR_SET = ['nnwwn', 'wnnnw', 'nwnnw', 'wwnnn', 'nnwnw', 'wnwnn', 'nwwnn', 'nnnww', 'wnnwn', 'nwnwn']
const RUN_WHITE = 255
const RUN_BLACK = 0

const isBitmap = (input) =>
  input &&
  typeof input === 'object' &&
  Number.isInteger(input.width) &&
  Number.isInteger(input.height) &&
  input.data &&
  typeof input.data.length === 'number'

const isMatrix = (input) => Array.isArray(input) && Array.isArray(input[0])

const matrixToColumns = (matrix) => matrix[0].map((_, x) => matrix.reduce((sum, row) => sum + (row[x] ?? 0), 0) / matrix.length)

const imageDataToColumns = (data, width, height) => {
  const channels = data.length === width * height * 4 ? 4 : 1
  return Array.from({ length: width }, (_, x) => {
    let sum = 0
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * channels
      const gray = channels === 4 ? Math.round((data[idx] + data[idx + 1] + data[idx + 2]) / 3) : data[idx]
      sum += gray
    }
    return sum / height
  })
}

const valuesToRuns = (values) => {
  if (!values.length) return []
  const threshold = (Math.min(...values) + Math.max(...values)) / 2
  const runs = []
  let count = 1
  let bin = values[0] > threshold ? RUN_WHITE : RUN_BLACK

  for (let i = 1; i < values.length; i++) {
    const next = values[i] > threshold ? RUN_WHITE : RUN_BLACK
    if (next === bin) count += 1
    else {
      runs.push({ bin, count })
      bin = next
      count = 1
    }
  }

  runs.push({ bin, count })
  return runs
}

const trimQuietZones = (runs) => {
  let start = 0
  let end = runs.length
  while (start + 1 < end && runs[start].bin === RUN_WHITE && runs[start].count > runs[start + 1].count * 2) start += 1
  while (end - 2 >= start && runs[end - 1].bin === RUN_WHITE && runs[end - 1].count > runs[end - 2].count * 2) end -= 1
  return runs.slice(start, end)
}

const classifyInterleavedGroup = (group) => {
  const ranked = group.map((width, index) => ({ width, index })).sort((a, b) => b.width - a.width)
  const wide = new Set(ranked.slice(0, 2).map(({ index }) => index))
  const minWide = Math.min(...ranked.slice(0, 2).map(({ width }) => width))
  const maxNarrow = Math.max(...ranked.slice(2).map(({ width }) => width))
  return minWide / maxNarrow < 1.1 ? '' : group.map((_, index) => (wide.has(index) ? 'w' : 'n')).join('')
}

const looksLikeInterleavedStart = (runs) => Math.max(...runs) / Math.min(...runs) < 2.5

const looksLikeInterleavedStop = ([wide, narrowA, narrowB]) => wide / Math.max(narrowA, narrowB) >= 1.1

const normalizeInput = (input) => {
  if (input && typeof input === 'object' && Array.isArray(input.columns)) return trimQuietZones(valuesToRuns(input.columns)).map((run) => run.count)
  if (Array.isArray(input)) return isMatrix(input) ? trimQuietZones(valuesToRuns(matrixToColumns(input))).map((run) => run.count) : input.slice()
  if (!isBitmap(input)) return []
  return trimQuietZones(valuesToRuns(imageDataToColumns(input.data, input.width, input.height))).map((run) => run.count)
}

const decodeWidths = (rawLines, type) => {
  const lines = rawLines.slice()
  const barThreshold = Math.ceil(lines.reduce((acc, item) => acc + item, 0) / lines.length)

  if (type === 'interleaved') {
    const matches = []

    for (let dataStart = 0; dataStart + 13 <= lines.length; dataStart++) {
      const start = dataStart >= 4 && looksLikeInterleavedStart(lines.slice(dataStart - 4, dataStart)) ? dataStart - 4 : dataStart
      for (let end = dataStart + 10; end + 3 <= lines.length; end += 10) {
        if (!looksLikeInterleavedStop(lines.slice(end, end + 3))) continue

        const code = []
        let valid = true
        for (let i = dataStart; i < end; i += 10) {
          const chunk = lines.slice(i, i + 10)
          const a = classifyInterleavedGroup(chunk.filter((_, n) => n % 2 === 0))
          const b = classifyInterleavedGroup(chunk.filter((_, n) => n % 2 !== 0))
          const da = CHAR_SET.indexOf(a)
          const db = CHAR_SET.indexOf(b)
          if (da < 0 || db < 0) {
            valid = false
            break
          }
          code.push(da, db)
        }
        if (valid) matches.push({ start, end: end + 3, code: code.join('') })
      }
    }

    return matches
      .sort((a, b) => b.code.length - a.code.length || a.start - b.start)
      .reduce((acc, match) => (acc.some(({ start, end }) => match.start < end && match.end > start) ? acc : [...acc, match]), [])
      .sort((a, b) => a.start - b.start)
      .map(({ code }) => code)
      .join(',')
  } else {
    const startChar = lines.splice(0, 6).filter((_, n) => n % 2 === 0).map((s) => (s > barThreshold ? 'w' : 'n')).join('')
    const endChar = lines.splice(-5, 5).filter((_, n) => n % 2 === 0).map((s) => (s > barThreshold ? 'w' : 'n')).join('')

    if (startChar !== 'wwn' || endChar !== 'wnw') return ''

    const code = []
    while (lines.length > 0) {
      const a = lines.splice(0, 10).filter((_, n) => n % 2 === 0).map((s) => (s > barThreshold ? 'w' : 'n')).join('')
      code.push(CHAR_SET.indexOf(a))
    }
    return code.join('')
  }
}

const decoder = (input, type) => {
  const lines = normalizeInput(input)
  if (!lines.length) return ''
  return decodeWidths(lines, type)
}

if (typeof module !== 'undefined') module.exports = { decoder }
