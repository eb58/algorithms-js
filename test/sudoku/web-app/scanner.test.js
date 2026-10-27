const { join } = require('node:path')
const sharp = require('sharp')
const {
  cellTransforms,
  findGrid,
  gridToImage,
  gridToString,
  recognizeDigits,
  scanSudoku,
  snapCorners,
  warpCorners
} = require('../../../src/sudoku/web-app/scanner')
const { countSolutions, sanitizeRecognition, solve } = require('../../../src/sudoku/web-app/sudoku')

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
const SCHATTEN = {
  puzzle: rows('..85917..', '.........', '3...6...1', '5..2.4..8', '8.3...6.2', '9..6.7..5', '4...2...3', '.........', '..93158..'),
  solution: rows('248591736', '651473289', '397862451', '516234978', '873159642', '924687315', '485726193', '132948567', '769315824')
}
const RAETSELHEFT = {
  puzzle: rows('.5.3.6.4.', '8...7...1', '...2.1...', '5.7...4.9', '.1.....6.', '4.6...1.5', '...4.5...', '3...9...7', '.9.7.2.5.'),
  solution: rows('751386942', '824579631', '963241578', '587163429', '219854763', '436927185', '172435896', '345698217', '698712354')
}
// Serienaufnahme vom 26.10.2026 aus der Hand: dasselbe Rätselheft, teils verwackelt und schräg, mit einer Bleistift-„4“ in der Ecke.
const SERIE = [
  'PXL_20261026_100901380.jpg',
  'PXL_20261026_100901838.jpg',
  'PXL_20261026_100902400.jpg',
  'PXL_20261026_100903312.jpg',
  'PXL_20261026_100904179.jpg',
  'PXL_20261026_100906298.jpg',
  'PXL_20261026_100906907.jpg',
  'PXL_20261026_100907861.jpg',
  'PXL_20261026_100908145.jpg',
  'PXL_20261026_100908339.jpg',
  'PXL_20261026_100909232.jpg',
  'PXL_20261026_100909393.jpg',
  'PXL_20261026_100909552.jpg'
]
// Problemfotos aus der App vom 27.10.2026: dasselbe Rätselheft, eine farbige Fläche hängt unten rechts am Gitter.
const FARBFLAECHE = [
  'sudoku-problem-17931024719601322579002421955066.jpg',
  'sudoku-problem-17931024846337804055380912567688.jpg',
  'sudoku-problem-17931024976032462769215135532606.jpg',
  'sudoku-problem-17931025088989161039966412706571.jpg',
  'sudoku-problem-17931025155336579757687048902026.jpg',
  'sudoku-problem-17931025321345813714900032118059.jpg',
  'sudoku-problem-17931025509941954986846925266807.jpg',
  'sudoku-problem-17931025703278931545649004918147.jpg',
  'sudoku-problem-17931056272875109213476290644207.jpg'
]
const DIAGONALEN = {
  puzzle: rows('...5.....', '......697', '126.....4', '.3....2..', '..81.39..', '7.9....6.', '...8.1..6', '.........', '4.3..5...')
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
    file: 'PXL_20261020_170757703.MP-2 Lösungen.jpg',
    scene: 'Zeitung quer, Sudoku mit Diagonalregeln und Lösungsraster daneben',
    ...DIAGONALEN,
    rotation: 1,
    corners: [
      [504, 114],
      [1135, 92],
      [1112, 749],
      [518, 702]
    ]
  },
  {
    file: 'PXL_20261024_161034906.jpg',
    scene: 'Zeitschrift, dunkler Schlagschatten am Gitterrand unten rechts',
    ...SCHATTEN,
    corners: [
      [203, 799],
      [953, 788],
      [961, 1542],
      [214, 1547]
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
  const { data, info } = await sharp(join(__dirname, '..', '..', '..', 'src', 'sudoku', 'web-app', 'fixtures', file))
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

  test('4. Sudoku im String-Format ausgeben und, falls unterstützt, lösen', () => {
    const text = gridToString(recognized.grid)

    expect(text).toBe(puzzle)
    if (solution) {
      expect(gridToString(solve(toGrid(text)))).toBe(solution)
    } else {
      // Dieses Fixture verwendet zusätzliche Diagonalregeln, die der Standardsolver nicht abbildet.
      expect(countSolutions(toGrid(text))).toBeGreaterThan(0)
    }
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

// Originale Kameradateien (4032 Pixel, inklusive Metadaten), nicht vorab verkleinerte Fotos.
// Beim ausgefüllten Zeitungsrätsel können zusätzlich korrekt gelesene Bleistiftzahlen erhalten bleiben.
describe.each([
  { file: 'PXL_20261015_062735592.jpg', ...RAETSELHEFT, rotation: 0 },
  // Die Drehlagen prüfen schon die übrigen Kamerafotos; von der Serie genügt die Aufnahme, wie sie ist.
  ...SERIE.map((file) => ({ file, ...RAETSELHEFT, rotation: 0, angles: [0] })),
  ...FARBFLAECHE.map((file) => ({ file, ...RAETSELHEFT, rotation: 1, angles: [0] })),
  // Vom Bildschirm abfotografiert: Der helle Rand des angezeigten Bilds umschließt das Gitter und darf es nicht verdrängen.
  { file: 'sudoku-problem-17931000817917669260673241107392.jpg', ...RAETSELHEFT, rotation: 1 },
  {
    file: 'PXL_20261014_162615343.jpg',
    puzzle: rows('...7.91..', '.16...4..', '79...2..8', '87..9....', '..3...8..', '....5..72', '3..1...89', '..2...75.', '..98.5...'),
    solution: rows('538749126', '216583497', '794612538', '875291364', '923467815', '641358972', '357124689', '482936751', '169875243'),
    rotation: 0
  },
  { file: 'PXL_20261014_162625239.jpg', ...ZEITUNG, handwritten: true, rotation: 0 },
  {
    file: 'PXL_20261014_162656609.jpg',
    puzzle: rows('..749.3..', '...5...4.', '....13857', '3...5.7.6', '...2.6...', '5.6.8...4', '41837....', '.7...5...', '..5.421..'),
    solution: rows('157498362', '863527941', '924613857', '382954716', '741236598', '596781234', '418379625', '279165483', '635842179'),
    rotation: 1
  },
  {
    // Rätselheft kopfüber, gewölbtes Papier, roter Rahmen mit angehängtem Etikett „Schwer 1“ an einer Ecke
    file: 'PXL_20261026_104220893.jpg',
    puzzle: rows('..7..5.8.', '.12876...', '68.4.....', '1..2...9.', '..4.5.1..', '.7...8..5', '.....1.62', '...68735.', '.6.9..8..'),
    solution: rows('497125683', '312876549', '685493217', '153264798', '824759136', '976318425', '738541962', '249687351', '561932874'),
    rotation: 2
  }
])('Smartphone-Kamerafoto $file', ({ file, puzzle, solution, handwritten = false, rotation, angles = [0, 90, 180, 270] }) => {
  test.each(angles)('erkennt und löst das Foto bei %i° wie die App', async (angle) => {
    const recognized = scanSudoku(await loadImage(file, angle))

    expect(recognized).not.toBeNull()
    expect(recognized.rotation).toBe((rotation - angle / 90 + 4) % 4)
    const sanitized = sanitizeRecognition(recognized.grid, recognized.confidence)
    const expected = toGrid(puzzle)
    if (handwritten) {
      expected.forEach((value, index) => {
        if (value) expect(sanitized.grid[index]).toBe(value)
      })
    } else {
      expect(recognized.grid).toEqual(expected)
      expect(sanitized.removed).toEqual([])
    }
    expect(countSolutions(sanitized.grid)).toBe(1)
    expect(gridToString(solve(sanitized.grid))).toBe(solution)
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

  test('liefert die Lage jeder Zelle passend zur erkannten Drehung', () => {
    const corners = [
      { x: 0, y: 0 },
      { x: 900, y: 0 },
      { x: 900, y: 900 },
      { x: 0, y: 900 }
    ]
    const round = (matrix) => matrix.map((value) => Math.round(value * 1e6) / 1e6 + 0)
    expect(round(cellTransforms(corners)[0])).toEqual([100, 0, 0, 100, 50, 50])
    expect(round(cellTransforms(corners)[80])).toEqual([100, 0, 0, 100, 850, 850])
    // Eine Vierteldrehung im Uhrzeigersinn macht das Sudoku lesbar: Seine erste Zeile liegt im Foto links, von unten nach oben.
    expect(round(cellTransforms(corners, 1)[0])).toEqual([0, -100, 100, 0, 50, 850])
    expect(round(cellTransforms(corners, 1)[8])).toEqual([0, -100, 100, 0, 50, 50])
    expect(round(cellTransforms(corners, 2)[0])).toEqual([-100, 0, 0, -100, 850, 850])
    expect(() => cellTransforms(corners, 4)).toThrow(TypeError)
    expect(() => cellTransforms(corners.slice(1))).toThrow(TypeError)
  })

  test('bildet Rasterpunkte perspektivisch korrekt ab', () => {
    // Trapez: Die obere Kante ist halb so breit wie die untere, liegt also weiter entfernt.
    const corners = [
      { x: 300, y: 0 },
      { x: 600, y: 0 },
      { x: 900, y: 900 },
      { x: 0, y: 900 }
    ]
    const [corner, third] = gridToImage(corners, [
      { x: 9, y: 9 },
      { x: 0, y: 3 }
    ])
    expect(corner.x).toBeCloseTo(900)
    expect(corner.y).toBeCloseTo(900)
    // Linear interpoliert läge die Blocklinie bei y = 300; perspektivisch rückt sie zur ferneren Kante hin.
    expect(third.y).toBeLessThan(300)
    expect(() => gridToImage(corners.slice(1), [])).toThrow(TypeError)
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
