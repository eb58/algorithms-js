const { readdirSync } = require('node:fs')
const { join } = require('node:path')
const sharp = require('sharp')
const { scanSudoku } = require('../../../src/sudoku/web-app/scanner')

// Negativfälle: In keinem Bild dieses Ordners darf ein Raster erkannt werden, etwa weil das Sudoku angeschnitten ist.
// Neue Negativfälle müssen nur dort abgelegt werden.
const DIRECTORY = join(__dirname, '..', '..', '..', 'src', 'sudoku', 'web-app', 'fixtures', 'negative')
const files = readdirSync(DIRECTORY).filter((file) => /\.(?:jpe?g|png|gif|webp)$/i.test(file))

const loadImage = async (file, angle) => {
  const { data, info } = await sharp(join(DIRECTORY, file)).rotate(angle).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height }
}

test('der Ordner enthält Negativfälle', () => {
  expect(files.length).toBeGreaterThan(0)
})

describe.each(files)('Negativfall %s', (file) => {
  test.each([0, 90, 180, 270])('liefert bei %i° kein Raster', async (angle) => {
    expect(scanSudoku(await loadImage(file, angle))).toBeNull()
  })
})
