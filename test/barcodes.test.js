const fs = require('fs')
const path = require('path')
const { barcodesFrom, barcodeFrom, barcodesFromRegions, scanBarcodes, decoder } = require('../src/barcodes/barcode')

const W = 3
const N = 1
const DIGITS = '1234'
const CHAR_SET = ['nnwwn', 'wnnnw', 'nwnnw', 'wwnnn', 'nnwnw', 'wnwnn', 'nwwnn', 'nnnww', 'wnnwn', 'nwnwn']

const patternToWidths = (pattern) => pattern.split('').flatMap((c) => [c === 'w' ? W : N, N]).slice(0, pattern.length * 2)
const digitToWidths = (digit) => patternToWidths(CHAR_SET[Number(digit)])

const encodeStandard = (digits) => [W, N, W, N, N, N, ...digits.split('').flatMap(digitToWidths), W, N, N, N, W]

const widthsToRow = (widths) => widths.flatMap((width, idx) => new Array(width).fill(idx % 2 === 0 ? 0 : 255))

const widthsToBitmap = (widths, height = 8) => {
  const row = widthsToRow(widths)
  return { width: row.length, height, data: Uint8ClampedArray.from(Array.from({ length: height }, () => row).flat()) }
}

// Sollwerte der Fixtures stammen aus der results.ini des Referenz-Readers
const readIniResults = (filePath) => {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const start = lines.indexOf('[RESULTS]')
  const nextSection = lines.findIndex((line, i) => i > start && /^\[.+\]$/.test(line))
  const end = nextSection < 0 ? lines.length : nextSection
  return lines.slice(start + 1, end).filter(Boolean).reduce((acc, line) => {
    const idx = line.indexOf('=')
    acc[line.slice(0, idx)] = line.slice(idx + 1)
    return acc
  }, {})
}

const interleavedFixtureCases = (folder) => {
  const base = path.join('test', 'fixtures', folder)
  return Object.entries(readIniResults(path.join(base, 'results.ini')))
    .map(([file, code]) => [path.join(base, file.replace(/\.tif$/, '.png')), code])
    .filter(([file]) => fs.existsSync(file))
}

const INTERLEAVED_FOLDERS = ['INTERLEAVE25_T1', 'INTERLEAVE25_T2', 'INTERLEAVE25_T3']

INTERLEAVED_FOLDERS.forEach((folder) =>
  describe(`${folder} results.ini`, () =>
    test.each(interleavedFixtureCases(folder))('%s', (file, codes) => {
      const expected = codes.split(',').filter(Boolean).sort()
      expect(barcodesFrom(file).sort()).toEqual(expected)
    }))
)

const CLEAN_FIXTURE = path.join('test', 'fixtures', 'INTERLEAVE25_T1', '248824711220.png')
const SKEWED_FIXTURE = path.join('test', 'fixtures', 'INTERLEAVE25_T1', '248832621220.png')

// decoder() ist die Stufe unter der Suche: ein bereits freigestellter Barcode, ohne Bandsuche.
// Diese drei Tests prüfen genau diesen Kern über seine drei Eingabeformen.
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

test('finds a standard barcode in a png file', () => {
  expect(barcodeFrom('test/fixtures/barcode-1234.png', { type: 'standard', minDigits: 4 })).toBe(DIGITS)
})

test('reads a scanned form barcode', () => {
  expect(barcodesFrom(CLEAN_FIXTURE)).toContain('3003294131')
  expect(barcodeFrom(CLEAN_FIXTURE)).toBe('3003294131')
})

test('refines an ambiguous first pass instead of returning form text', () => {
  expect(barcodeFrom(SKEWED_FIXTURE)).toBe('3003294148')
})

test('scan hits carry position and votes', () => {
  const [hit] = scanBarcodes(CLEAN_FIXTURE).filter(({ code }) => code === '3003294131')

  expect(hit.votes).toBeGreaterThan(1)
  expect(hit.y).toBeGreaterThan(0)
})

test('stops after the first hit', () => {
  expect(barcodeFrom(CLEAN_FIXTURE, { first: true })).toBe('3003294131')
})

test('limits the scan to a region', () => {
  const above = { height: 40 } // oberer Bildrand, weit über dem Barcode

  expect(barcodesFrom(CLEAN_FIXTURE, { region: above })).toEqual([])
  expect(barcodesFromRegions(CLEAN_FIXTURE, [above, {}])).toEqual([[], expect.arrayContaining(['3003294131'])])
})
