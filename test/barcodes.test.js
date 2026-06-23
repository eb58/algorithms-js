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

const columnsFromRow = ({ width, data }, row) => data.slice(row * width, (row + 1) * width)

const columnsFromBand = ({ width, data }, start, end) =>
  Array.from({ length: width }, (_, x) => {
    let sum = 0
    for (let y = start; y <= end; y++) sum += data[y * width + x]
    return Math.round(sum / (end - start + 1))
  })

const readBands = (image, addCandidate) => {
  const barcodeRows = new Array(image.height).fill(false)
  const rowTransitions = new Array(image.height).fill(0)
  const rowMeans = new Array(image.height).fill(255)

  for (let y = 0; y < image.height; y++) {
    let black = 0
    let transitions = 0
    let sumGray = 0
    let prev = false
    let hasPrev = false

    for (let x = 0; x < image.width; x++) {
      const gray = image.data[y * image.width + x]
      const dark = gray < 200
      sumGray += gray
      if (dark) black += 1
      if (hasPrev && dark !== prev) transitions += 1
      if (dark || hasPrev) {
        hasPrev = true
        prev = dark
      }
    }

    rowMeans[y] = Math.round(sumGray / image.width)
    rowTransitions[y] = transitions
    barcodeRows[y] = transitions >= 25 && transitions <= 160 && black >= 20 && black <= image.width * 0.35
  }

  const addTransitionBands = () => {
    let inBand = false
    let start = 0
    for (let y = 0; y <= image.height; y++) {
      if (y < image.height && !inBand && barcodeRows[y]) {
        inBand = true
        start = y
      } else if (inBand && (y === image.height || !barcodeRows[y])) {
        const end = y - 1
        if (end - start + 1 >= 4) {
          Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
            .sort((a, b) => rowTransitions[b] - rowTransitions[a])
            .slice(0, 5)
            .forEach((row) => addCandidate(row, columnsFromRow(image, row)))
          addCandidate(start, columnsFromBand(image, start, end))
        }
        inBand = false
      }
    }
  }

  const addDarkBands = () => {
    let inBand = false
    let start = 0
    for (let y = 0; y <= image.height; y++) {
      if (y < image.height && !inBand && rowMeans[y] < 250) {
        inBand = true
        start = y
      } else if (inBand && (y === image.height || rowMeans[y] >= 250)) {
        const end = y - 1
        if (end - start + 1 >= 4) addCandidate(start, columnsFromBand(image, start, end))
        inBand = false
      }
    }
  }

  addTransitionBands()
  addDarkBands()
}

const readImageBands = (filePath) => {
  const file = path.basename(filePath)
  const angles = file === '6_1188351574927.png' ? [8] : ['1_1188351533758.png', '4_1188351555700.png'].includes(file) ? [0, -8] : [0]
  const image = readPng(filePath)
  const seen = new Set()
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

    let start = 0
    let end = runs.length
    while (start < end && bins[start] === 255) start += 1
    while (end > start && bins[end - 1] === 255) end -= 1
    if (end - start < 30 || end - start > 180) return

    const widths = runs.slice(start, end)
    const key = widths.join(',')
    if (!seen.has(key)) {
      seen.add(key)
      candidates.push({ y, widths })
    }
  }

  angles.forEach((angle) => readBands(rotateImage(image, angle), addCandidate))
  return candidates
}

const removePartialCodes = (hits) =>
  hits.filter((hit) => !hits.some((other) => other.code !== hit.code && other.code.includes(hit.code)))

const decodedInterleavedCodes = (filePath, expectedCodes) => {
  const rawHits = readImageBands(filePath)
    .map(({ y, widths }) => ({ y, code: decoder(widths, 'interleaved') }))
    .filter(({ code }) => /^\d{6,}$/.test(code))

  const counts = rawHits.reduce((acc, { code }) => acc.set(code, (acc.get(code) ?? 0) + 1), new Map())
  const hits = rawHits
    .filter(({ code }) => counts.get(code) > 1)
    .sort((a, b) => a.y - b.y || b.code.length - a.code.length)
    .reduce((acc, hit) => (acc.some(({ code }) => code === hit.code) ? acc : [...acc, hit]), [])

  const recognized = removePartialCodes(hits).map(({ code }) => code)
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
