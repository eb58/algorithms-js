const { join } = require('node:path')
const sharp = require('sharp')
const { findGrid, gridToString, recognizeDigits, scanSudoku, snapCorners, warpCorners } = require('../../src/sudoku-app/scanner')
const { solve } = require('../../src/sudoku-app/sudoku')

const rows = (...lines) => lines.join('')
const toGrid = (value) => [...value].map((digit) => (digit === '.' ? 0 : Number(digit)))

const EXPERTE = {
  puzzle: rows('5.26.....', '9..3.....', '......63.', '..3....28', '....46...', '..8.....9', '....249..', '.7...3...', '....6.142'),
  solution: rows('532671894', '946385217', '817492635', '463159728', '729846351', '158237469', '681524973', '274913586', '395768142')
}
const LEICHT = {
  puzzle: rows('1.62.7.9.', '.3....25.', '..43....6', '.8..7.96.', '61....4..', '54.681.3.', '....69.23', '8.3.15.4.', '9...3...7'),
  solution: rows('156247398', '738196254', '294358176', '382574961', '617923485', '549681732', '471869523', '823715649', '965432817')
}

// Ecken des äußeren Gitters (oben links, oben rechts, unten rechts, unten links) in Pixeln des Originalfotos,
// einmalig visuell geprüft. Die Toleranz liegt deutlich unter einer Zellbreite.
const FIXTURES = [
  {
    file: 'PXL_20261013_125325969.MP.jpg',
    scene: 'Bildschirm, frontal',
    ...EXPERTE,
    corners: [
      [47, 400],
      [840, 401],
      [813, 1168],
      [69, 1163]
    ]
  },
  {
    file: 'PXL_20261013_125831023.jpg',
    scene: 'Bildschirm, stark perspektivisch',
    ...EXPERTE,
    corners: [
      [77, 433],
      [871, 471],
      [799, 1164],
      [128, 1188]
    ]
  },
  {
    file: 'PXL_20261013_130414059.jpg',
    scene: 'Bildschirm mit grauer Benutzereingabe',
    ...LEICHT,
    corners: [
      [175, 477],
      [801, 481],
      [767, 1083],
      [192, 1075]
    ]
  },
  {
    file: 'PXL_20261013_131613617.jpg',
    scene: 'Ausdruck mit zusätzlichem Lösungsgitter',
    ...EXPERTE,
    corners: [
      [149, 360],
      [733, 319],
      [771, 924],
      [144, 935]
    ]
  },
  {
    file: 'PXL_20261013_131631210.MP.jpg',
    scene: 'Ausdruck, gedreht und angeschnitten',
    ...EXPERTE,
    corners: [
      [55, 510],
      [799, 471],
      [827, 1245],
      [69, 1236]
    ]
  }
]
const CORNER_TOLERANCE = 16

// Schritt 1: Bild einlesen – in Node über sharp, im Browser über ein Canvas. angle dreht das Foto zusätzlich im Uhrzeigersinn.
const loadImage = async (file, angle = 0) => {
  const { data, info } = await sharp(join(__dirname, '..', '..', 'src', 'sudoku-app', 'fixtures', file))
    .rotate(angle)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height }
}

describe.each(FIXTURES)('Sudoku-Foto $file ($scene)', ({ file, puzzle, solution, corners }) => {
  let image
  let found
  let recognized

  beforeAll(async () => {
    image = await loadImage(file)
  })

  test('1. Bild einlesen', () => {
    expect(image.width).toBeGreaterThan(0)
    expect(image.data).toHaveLength(image.width * image.height * 4)
  })

  test('2. Sudokuraster erkennen', () => {
    found = findGrid(image)

    expect(found).not.toBeNull()
    found.corners.forEach((corner, index) => {
      expect(Math.abs(corner.x - corners[index][0])).toBeLessThan(CORNER_TOLERANCE)
      expect(Math.abs(corner.y - corners[index][1])).toBeLessThan(CORNER_TOLERANCE)
    })
  })

  test('3. Ziffern im Raster erkennen', () => {
    recognized = recognizeDigits(found.board)

    expect(recognized.grid).toEqual(toGrid(puzzle))
    expect(recognized.rotation).toBe(0)
  })

  test('4. Sudoku im String-Format ausgeben und lösen', () => {
    const text = gridToString(recognized.grid)

    expect(text).toBe(puzzle)
    expect(gridToString(solve(toGrid(text)))).toBe(solution)
  })

  test('entzerrt mit vorgegebenen Ecken dasselbe Raster', () => {
    expect(warpCorners(image, found.corners)).toEqual(found.board)
  })

  test('ungenau gesetzte Ecken rasten auf das Gitter ein', () => {
    const cell = Math.hypot(found.corners[1].x - found.corners[0].x, found.corners[1].y - found.corners[0].y) / 9
    // eine einzelne Ecke um 0,4 Zellen schräg verschoben, wie bei einem ungenauen Griff auf dem Handy
    const loose = found.corners.map((point, index) => (index === 1 ? { x: point.x + cell * 0.3, y: point.y + cell * 0.27 } : point))

    const snapped = snapCorners(image, loose)

    expect(snapped).toEqual(found.corners)
    expect(gridToString(recognizeDigits(warpCorners(image, snapped)).grid)).toBe(puzzle)
  })

  test('weit entfernte Ecken bleiben wie vom Nutzer gesetzt', () => {
    const cell = Math.hypot(found.corners[1].x - found.corners[0].x, found.corners[1].y - found.corners[0].y) / 9
    const far = found.corners.map((point, index) => (index === 1 ? { x: point.x - cell * 1.5, y: point.y } : point))

    expect(snapCorners(image, far)).toEqual(far)
  })

  test('scanSudoku liefert dasselbe Ergebnis in einem Aufruf', () => {
    expect(gridToString(scanSudoku(image).grid)).toBe(puzzle)
  })
})

// Flach über dem Papier fotografiert, speichern Handys das Bild oft quer oder auf dem Kopf.
describe.each(FIXTURES)('gedrehtes Sudoku-Foto $file', ({ file, puzzle }) => {
  test.each([90, 180, 270])('wird auch um %i° gedreht erkannt', async (angle) => {
    const result = scanSudoku(await loadImage(file, angle))

    expect(gridToString(result.grid)).toBe(puzzle)
    expect(result.rotation).toBe((4 - angle / 90) % 4)
  })
})

describe('Sudoku-Scanner ohne Foto', () => {
  const blank = (width, height) => ({ data: new Uint8ClampedArray(width * height * 4).fill(255), width, height })

  test('lehnt ungültige Bilddaten ab', () => {
    expect(() => findGrid({ data: new Uint8ClampedArray(10), width: 2, height: 2 })).toThrow(TypeError)
    expect(() => findGrid({})).toThrow(TypeError)
    expect(() => warpCorners(blank(10, 10), [{ x: 0, y: 0 }])).toThrow(TypeError)
    expect(() => snapCorners(blank(10, 10), null)).toThrow(TypeError)
  })

  test('findet in einem leeren Bild kein Raster', () => {
    expect(findGrid(blank(200, 300))).toBeNull()
    expect(scanSudoku(blank(200, 300))).toBeNull()
  })

  test('serialisiert ein Raster als 81-stelligen String und prüft die Eingabe', () => {
    expect(gridToString([5, 0, 2, 6, ...Array(77).fill(0)])).toBe(`5.26${'.'.repeat(77)}`)
    expect(() => gridToString(Array(80).fill(0))).toThrow(TypeError)
    expect(() => gridToString([10, ...Array(80).fill(0)])).toThrow(TypeError)
  })
})
