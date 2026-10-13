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
const ZEITUNG = {
  puzzle: rows('6.2..83..', '9..64....', '.71.3....', '.48....2.', '.1..6..3.', '.9....18.', '....8.26.', '....23..9', '..71..4.3'),
  solution: rows('652918347', '983647512', '471235698', '748351926', '215869734', '396472185', '539784261', '164523879', '827196453')
}
const WEB = {
  puzzle: rows('....1.75.', '7486..3.1', '3...94...', '1.4..65.7', '59..7..3.', '....48...', '43.1....2', '9.2...64.', '8.7.5.91.'),
  solution: rows('629813754', '748625391', '351794286', '184936527', '596271438', '273548169', '435169872', '912387645', '867452913')
}
const SCREENSHOT = {
  puzzle: rows('...83....', '....74.5.', '.........', '..4..6..8', '2...8...9', '.6.1.24..', '..57..9.3', '98......5', '..1.65..4'),
  solution: rows('542831796', '198674352', '637529841', '714396528', '253487619', '869152437', '425718963', '986243175', '371965284')
}
const WIKIPEDIA = {
  puzzle: rows('53..7....', '6..195...', '.98....6.', '8...6...3', '4..8.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79'),
  solution: rows('534678912', '672195348', '198342567', '859761423', '426853791', '713924856', '961537284', '287419635', '345286179')
}
const LEICHT = {
  puzzle: rows('1.62.7.9.', '.3....25.', '..43....6', '.8..7.96.', '61....4..', '54.681.3.', '....69.23', '8.3.15.4.', '9...3...7'),
  solution: rows('156247398', '738196254', '294358176', '382574961', '617923485', '549681732', '471869523', '823715649', '965432817')
}

// Ecken des äußeren Gitters (oben links, oben rechts, unten rechts, unten links) in Pixeln des Originalfotos,
// einmalig visuell geprüft. Die Toleranz liegt deutlich unter einer Zellbreite. rotation: Vierteldrehungen im
// Uhrzeigersinn, um die das Raster gedreht werden muss (quer gespeicherte Handyfotos). Auf den Zeitungsfotos sind
// Kontaktdaten von Privatpersonen unkenntlich gemacht; Anzeige, Text und Lösungsraster bleiben als Störfaktoren.
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
  },
  {
    file: 'PXL_20261013_161402316.MP.jpg',
    scene: 'Zeitung quer, graue Blöcke, gewelltes Papier, Lösungsraster daneben',
    ...ZEITUNG,
    rotation: 1,
    corners: [
      [369, 188],
      [1043, 151],
      [1069, 816],
      [390, 849]
    ]
  },
  {
    file: 'PXL_20261013_163128286.MP.jpg',
    scene: 'Zeitung quer, klein im Bild, Comic und Anzeige daneben',
    ...ZEITUNG,
    rotation: 1,
    corners: [
      [753, 237],
      [1265, 210],
      [1267, 710],
      [767, 711]
    ]
  },
  {
    file: 'PXL_20261013_163135274.MP.jpg',
    scene: 'Zeitung quer, perspektivisch',
    ...ZEITUNG,
    rotation: 1,
    corners: [
      [605, 196],
      [1216, 156],
      [1223, 763],
      [624, 765]
    ]
  },
  {
    file: 'PXL_20261013_163138704.MP.jpg',
    scene: 'Zeitung quer und schräg gedreht',
    ...ZEITUNG,
    rotation: 1,
    corners: [
      [593, 125],
      [1223, 155],
      [1159, 773],
      [549, 710]
    ]
  },
  {
    file: 'PXL_20261013_170916279.MP.jpg',
    scene: 'Ausdruck quer, Streiflicht, Tastatur daneben',
    ...EXPERTE,
    rotation: 1,
    corners: [
      [512, 57],
      [1360, 16],
      [1345, 857],
      [548, 851]
    ]
  },
  {
    file: 'PXL_20261013_170922870.MP.jpg',
    scene: 'Ausdruck quer, Streiflicht, schräg',
    ...EXPERTE,
    rotation: 1,
    corners: [
      [616, 25],
      [1469, 41],
      [1384, 883],
      [591, 811]
    ]
  },
  {
    file: 'PXL_20261013_170925953.MP.jpg',
    scene: 'Ausdruck quer, Gitter am Bildrand',
    ...EXPERTE,
    rotation: 1,
    corners: [
      [588, 63],
      [1417, 0],
      [1415, 827],
      [636, 816]
    ]
  },
  {
    file: 'PXL_20261013_170926674.jpg',
    scene: 'Ausdruck quer, Schatten',
    ...EXPERTE,
    rotation: 1,
    corners: [
      [583, 93],
      [1419, 13],
      [1427, 849],
      [645, 851]
    ]
  },
  {
    file: 'web-klein-markiert.png',
    scene: 'Webseite, nur 320 × 320 Pixel, kleine Ziffern, farbig markierte Zellen',
    ...WEB,
    corners: [
      [0, 0],
      [319, 0],
      [319, 319],
      [0, 319]
    ]
  },
  {
    file: 'screenshot-192100.png',
    scene: 'Bildschirmfoto, fette Ziffern, dicke Blocklinien',
    ...SCREENSHOT,
    corners: [
      [53, 8],
      [791, 8],
      [791, 746],
      [53, 746]
    ]
  },
  {
    file: 'wikipedia-beispiel.gif',
    scene: 'GIF, 300 × 301 Pixel, Rand um das Gitter',
    ...WIKIPEDIA,
    corners: [
      [6, 6],
      [293, 6],
      [293, 294],
      [6, 294]
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

describe.each(FIXTURES)('Sudoku-Foto $file ($scene)', ({ file, puzzle, solution, corners, rotation = 0 }) => {
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
    expect(recognized.rotation).toBe(rotation)
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
describe.each(FIXTURES)('gedrehtes Sudoku-Foto $file', ({ file, puzzle, rotation = 0 }) => {
  test.each([90, 180, 270])('wird auch um %i° gedreht erkannt', async (angle) => {
    const result = scanSudoku(await loadImage(file, angle))

    expect(gridToString(result.grid)).toBe(puzzle)
    expect(result.rotation).toBe((rotation - angle / 90 + 4) % 4)
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
