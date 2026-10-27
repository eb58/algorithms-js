const { join } = require('node:path')
const sharp = require('sharp')
const { scanSudoku, gridToString } = require('../../../src/sudoku/web-app/scanner')
const { countSolutions, sanitizeRecognition, solve, validate } = require('../../../src/sudoku/web-app/sudoku')

// Unabhängig vom OCR-Ergebnis visuell aus den Originalbildern abgelesen.
// Herkunft, Lizenz und Bearbeitung: src/sudoku/web-app/fixtures/SOURCES.md.
const fixtures = [
  {
    file: 'commons-17-clues.png',
    scene: 'nur 17 Vorgaben, vollständig leere letzte Zeile',
    rows: ['....4....', '12.....73', '.3...8...', '..4...6..', '...2.3...', '..5......', '..6.9.5..', '.7.....2.', '.........']
  },
  {
    file: 'commons-18-clues.png',
    scene: '18 symmetrische Vorgaben, mehrere vollständig leere Zeilen',
    rows: ['.........', '.9..1..3.', '..6.2.7..', '...3.4...', '21.....98', '.........', '..25.64..', '.8.....1.', '.........']
  },
  {
    file: 'commons-9x9.jpg',
    scene: 'große Ziffern und blasse innere Gitterlinien',
    rows: ['96.81....', '7....2...', '..8.76.12', '671.2..38', '.3.68..97', '...73..61', '54.36...9', '18.29..54', '.96.4..7.']
  }
]

const loadImage = async (file, angle) => {
  const { data, info } = await sharp(join(__dirname, '../../../src/sudoku/web-app/fixtures', file))
    .rotate(angle)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

describe.each(fixtures)('Internet-Fixture $file ($scene)', ({ file, rows }) => {
  test.each([0, 90, 180, 270])('erkennt bei %i° alle Vorgaben und löst eindeutig', async (angle) => {
    const recognized = scanSudoku(await loadImage(file, angle))

    expect(recognized).not.toBeNull()
    expect(recognized.rotation).toBe((4 - angle / 90) % 4)
    expect(gridToString(recognized.grid)).toBe(rows.join(''))
    const sanitized = sanitizeRecognition(recognized.grid, recognized.confidence)
    expect(sanitized.removed).toEqual([])
    expect(countSolutions(sanitized.grid)).toBe(1)
    const solution = solve(sanitized.grid)
    expect(validate(solution)).toBe(true)
    expect(solution.every((value) => value > 0)).toBe(true)
    recognized.grid.forEach((value, index) => {
      if (value) expect(solution[index]).toBe(value)
    })
  })
})
