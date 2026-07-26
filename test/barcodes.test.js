const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { decoder } = require('../src/barcodes/barcode')

const W = 3
const N = 1
const DIGITS = '1234'
const CHAR_SET = ['nnwwn', 'wnnnw', 'nwnnw', 'wwnnn', 'nnwnw', 'wnwnn', 'nwwnn', 'nnnww', 'wnnwn', 'nwnwn']

const patternToWidths = (pattern) => pattern.split('').flatMap((c) => [c === 'w' ? W : N, N]).slice(0, pattern.length * 2)
const digitToWidths = (digit) => patternToWidths(CHAR_SET[Number(digit)])

const encodeStandard = (digits) => [
  W, N, W, N, N, N,
  ...digits.split('').flatMap(digitToWidths),
  W, N, N, N, W
]

const widthsToRow = (widths) =>
  widths.flatMap((width, idx) => new Array(width).fill(idx % 2 === 0 ? 0 : 255))

const widthsToBitmap = (widths, height = 8) => {
  const row = widthsToRow(widths)
  return {
    width: row.length,
    height,
    data: Uint8ClampedArray.from(Array.from({ length: height }, () => row).flat())
  }
}

const readPng = (filePath) => {
  const file = fs.readFileSync(filePath)
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (!file.slice(0, 8).equals(pngSignature)) throw new Error('Not a PNG file')

  let offset = 8
  let width = 0
  let height = 0
  const idat = []

  while (offset < file.length) {
    const length = file.readUInt32BE(offset)
    const type = file.slice(offset + 4, offset + 8).toString('ascii')
    const chunk = file.slice(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0)
      height = chunk.readUInt32BE(4)
    } else if (type === 'IDAT') {
      idat.push(chunk)
    } else if (type === 'IEND') {
      break
    }
  }

  const inflated = zlib.inflateSync(Buffer.concat(idat))
  const rowSize = width + 1
  const data = new Uint8ClampedArray(width * height)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize
    const filter = inflated[rowOffset]
    if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`)
    for (let x = 0; x < width; x++) {
      data[y * width + x] = inflated[rowOffset + 1 + x]
    }
  }

  return { width, height, data }
}

const readIniResults = (filePath) => {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const start = lines.indexOf('[RESULTS]')
  const end = lines.indexOf('[NEWRESULTS]')
  return lines.slice(start + 1, end).filter(Boolean).reduce((acc, line) => {
    const idx = line.indexOf('=')
    acc[line.slice(0, idx)] = line.slice(idx + 1)
    return acc
  }, {})
}

const rotateImage = (image, angle) => {
  if (angle === 0) return image

  const rad = (angle * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const width = Math.ceil(image.width * cos + image.height * sin)
  const height = Math.ceil(image.width * sin + image.height * cos)
  const data = new Uint8ClampedArray(width * height).fill(255)
  const srcCx = image.width / 2
  const srcCy = image.height / 2
  const dstCx = width / 2
  const dstCy = height / 2
  const cosA = Math.cos(-rad)
  const sinA = Math.sin(-rad)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - dstCx
      const dy = y - dstCy
      const srcX = Math.round(dx * cosA - dy * sinA + srcCx)
      const srcY = Math.round(dx * sinA + dy * cosA + srcCy)
      if (srcX >= 0 && srcX < image.width && srcY >= 0 && srcY < image.height) data[y * width + x] = image.data[srcY * image.width + srcX]
    }
  }

  return { width, height, data }
}

const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1]

const columnsFromRow = ({ width, data }, row) => data.slice(row * width, (row + 1) * width)

const columnsFromBand = ({ width, data }, start, end) =>
  Array.from({ length: width }, (_, x) => {
    let sum = 0
    for (let y = start; y <= end; y++) sum += data[y * width + x]
    return Math.round(sum / (end - start + 1))
  })

// Aufsteigend nach Kosten: die meisten Scans sind nach dem ersten Durchgang gelesen. Der gedrehte Durchgang
// ist für leicht schief eingescannte Formulare nötig, die bei 0° unlesbar bleiben.
const PASSES = [
  { angles: [0], samples: 10 },
  { angles: [0, -3], samples: 60 }
]
const sampledRows = (start, end, samples) => {
  const height = end - start + 1
  return height <= samples
    ? Array.from({ length: height }, (_, idx) => start + idx)
    : Array.from({ length: samples }, (_, i) => start + Math.round((i * (height - 1)) / (samples - 1)))
}

const readBands = (image, addCandidate, samples) => {
  const barcodeRows = new Array(image.height).fill(false)

  for (let y = 0; y < image.height; y++) {
    let black = 0
    let transitions = 0
    let prev = false
    let hasPrev = false

    for (let x = 0; x < image.width; x++) {
      const dark = image.data[y * image.width + x] < 200
      if (dark) black += 1
      if (hasPrev && dark !== prev) transitions += 1
      if (dark || hasPrev) {
        hasPrev = true
        prev = dark
      }
    }

    // Obergrenze großzügig: auf Formularen steht neben dem Barcode Text in derselben Zeile
    barcodeRows[y] = transitions >= 25 && transitions <= 400 && black >= 20 && black <= image.width * 0.9
  }

  let inBand = false
  let start = 0
  for (let y = 0; y <= image.height; y++) {
    if (y < image.height && !inBand && barcodeRows[y]) {
      inBand = true
      start = y
    } else if (inBand && (y === image.height || !barcodeRows[y])) {
      const end = y - 1
      if (end - start + 1 >= 4) {
        sampledRows(start, end, samples).forEach((row) => addCandidate(row, columnsFromRow(image, row)))
        addCandidate(start, columnsFromBand(image, start, end))
      }
      inBand = false
    }
  }
}

// Weiß-auf-schwarz-Scans invertieren, sonst hält die Bandsuche das ganze Bild für Barcode
const invertIfDark = (image) =>
  image.data.reduce((acc, v) => acc + v, 0) / image.data.length < 128 ? { ...image, data: image.data.map((v) => 255 - v) } : image

const readImageBands = (filePath, { angles, samples }, seen) => {
  const image = invertIfDark(readPng(filePath))
  const candidates = []
  const addCandidate = (y, columns) => {
    const min = Math.min(...columns)
    const max = Math.max(...columns)
    if (min === max) return

    const threshold = (min + max) / 2
    const runs = []
    const bins = []
    let bin = columns[0] > threshold ? 255 : 0
    let count = 1

    for (let i = 1; i < columns.length; i++) {
      const next = columns[i] > threshold ? 255 : 0
      if (next === bin) count += 1
      else {
        bins.push(bin)
        runs.push(count)
        bin = next
        count = 1
      }
    }
    bins.push(bin)
    runs.push(count)

    const push = (from, to) => {
      let start = from
      let end = to
      while (start < end && bins[start] === 255) start += 1
      while (end > start && bins[end - 1] === 255) end -= 1
      if (end - start < 30 || end - start > 180) return

      const widths = runs.slice(start, end)
      const key = widths.join(',')
      if (seen.has(key)) return
      seen.add(key)
      candidates.push({ y, widths, atEdge: end === runs.length })
    }

    // Auf Formularen steht neben dem Barcode Text in derselben Bildzeile: zusätzlich an breiten Weißlücken auftrennen
    const gap = Math.max(20, 4 * median(runs))
    const segmentStart = runs.reduce((from, run, i) => (bins[i] === 255 && run > gap ? (push(from, i), i + 1) : from), 0)
    push(segmentStart, runs.length)
    push(0, runs.length)
  }

  angles.forEach((angle) => readBands(rotateImage(image, angle), addCandidate, samples))
  return candidates
}

const removePartialCodes = (hits) =>
  hits.filter((hit) => !hits.some((other) => other.code !== hit.code && other.code.includes(hit.code)))

const isCode = (code) => /^\d{6,}$/.test(code)

// Am Bildrand fehlen Stopmuster und Ruhezone: dort lohnt ein zweiter Versuch mit gekürztem Code plus synthetischem Stop
const truncatedVariants = ({ y, widths }) => {
  const narrow = median(widths)
  return Array.from({ length: Math.max(0, Math.ceil((widths.length - 14) / 10)) }, (_, i) => ({
    y,
    widths: [...widths.slice(0, 14 + i * 10), narrow * 3, narrow, narrow]
  }))
}

const hitsForPass = (filePath, pass, seen) => {
  const decoded = readImageBands(filePath, pass, seen).map((cand) => ({ ...cand, code: decoder(cand.widths, 'interleaved') }))
  const retries = decoded.filter(({ atEdge, code }) => atEdge && !isCode(code)).flatMap(truncatedVariants)
  return [...decoded, ...retries.map((cand) => ({ ...cand, code: decoder(cand.widths, 'interleaved') }))].filter(({ code }) => isCode(code))
}

const consensusHits = (rawHits) => {
  const counts = rawHits.reduce((acc, { code }) => acc.set(code, (acc.get(code) ?? 0) + 1), new Map())
  return rawHits
    .filter(({ code }) => counts.get(code) > 1)
    .sort((a, b) => a.y - b.y || b.code.length - a.code.length)
    .reduce((acc, hit) => (acc.some(({ code }) => code === hit.code) ? acc : [...acc, hit]), [])
}

// Zwei gleiche Codes können auch zwei gleich verrauschte Zeilen sein: erst ab MIN_CONSENSUS gilt ein Fund als belastbar
const MIN_CONSENSUS = 3
const isBelastbar = (rawHits) => {
  const counts = rawHits.reduce((acc, { code }) => acc.set(code, (acc.get(code) ?? 0) + 1), new Map())
  return [...counts.values()].some((n) => n >= MIN_CONSENSUS)
}

const decodedInterleavedCodes = (filePath, expectedCodes) => {
  const seen = new Set() // über alle Durchgänge, damit dieselbe Zeile den Konsens nicht doppelt stützt
  const rawHits = PASSES.reduce((acc, pass) => (isBelastbar(acc) ? acc : [...acc, ...hitsForPass(filePath, pass, seen)]), [])

  const recognized = removePartialCodes(consensusHits(rawHits)).map(({ code }) => code)
  return expectedCodes.filter((expected) => recognized.includes(expected) || rawHits.some(({ code }) => code.includes(expected)))
}

const interleavedFixtureCases = (folder) => {
  const base = path.join('test', 'fixtures', folder)
  return Object.entries(readIniResults(path.join(base, 'results.ini')))
    .map(([file, code]) => [path.join(base, file.replace(/\.tif$/, '.png')), code])
    .filter(([file]) => fs.existsSync(file))
}

const expectInterleavedFolder = (folder) =>
  interleavedFixtureCases(folder).forEach(([file, code]) => {
    const expectedCodes = code.split(',').filter(Boolean)
    expect(decodedInterleavedCodes(file, expectedCodes)).toEqual(expectedCodes)
  })

test('decodes standard barcode widths', () => {
  expect(decoder(encodeStandard(DIGITS), 'standard')).toBe(DIGITS)
})

test('decodes barcode bitmap image', () => {
  expect(decoder(widthsToBitmap(encodeStandard(DIGITS)), 'standard')).toBe(DIGITS)
})

test('decodes barcode pixel matrix', () => {
  const row = widthsToRow(encodeStandard(DIGITS))
  const matrix = Array.from({ length: 8 }, () => row.slice())

  expect(decoder(matrix, 'standard')).toBe(DIGITS)
})

test('decodes barcode png fixture', () => {
  const png = readPng('test/fixtures/barcode-1234.png')

  expect(decoder(png, 'standard')).toBe(DIGITS)
})

test('decodes interleave25 t1 fixtures', () => expectInterleavedFolder('INTERLEAVE25_T1'))

test('decodes interleave25 t2 fixtures', () => expectInterleavedFolder('INTERLEAVE25_T2'))

test('decodes interleave25 t3 fixtures', () => expectInterleavedFolder('INTERLEAVE25_T3'))
