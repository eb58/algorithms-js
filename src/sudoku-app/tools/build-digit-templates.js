// Erzeugt src/sudoku-app/digit-templates.js aus gerenderten Ziffern gängiger Schriften.
// Aufruf: node src/sudoku-app/tools/build-digit-templates.js (benötigt sharp und die genannten Systemschriften)
const { writeFileSync } = require('node:fs')
const { join } = require('node:path')
const prettier = require('prettier')
const sharp = require('sharp')
const { GLYPH_HEIGHT, GLYPH_WIDTH, normalizeGlyph } = require('../scanner')

const FONTS = [
  'Arial',
  'Arial;font-weight:bold',
  'Verdana',
  'Verdana;font-weight:bold',
  'Segoe UI',
  'Segoe UI;font-weight:bold',
  'Calibri',
  'Tahoma',
  'Times New Roman',
  'Times New Roman;font-weight:bold'
]
const SIZE = 160

const renderDigit = async (font, digit) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="100%" height="100%" fill="white"/><text x="40" y="125" style="font-family:${font};font-size:110px">${digit}</text></svg>`
  const { data, info } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true })
  const ink = Uint8Array.from(data, (value) => (value < 128 ? 1 : 0))
  const box = { minX: info.width, minY: info.height, maxX: -1, maxY: -1 }
  ink.forEach((value, index) => {
    if (!value) return
    const x = index % info.width
    const y = Math.floor(index / info.width)
    box.minX = Math.min(box.minX, x)
    box.minY = Math.min(box.minY, y)
    box.maxX = Math.max(box.maxX, x)
    box.maxY = Math.max(box.maxY, y)
  })
  if (box.maxX < 0) throw new Error(`Ziffer ${digit} in ${font} nicht gerendert`)
  const { values, aspect } = normalizeGlyph(ink, info.width, box)
  return {
    digit,
    font: font.replace(';font-weight:', ' '),
    aspect: Math.round(aspect * 1000) / 1000,
    values: Array.from(values, (v) => Math.round(v * 9)).join('')
  }
}

const main = async () => {
  const templates = []
  for (const font of FONTS) for (let digit = 1; digit <= 9; digit += 1) templates.push(await renderDigit(font, digit))
  const source = `// Automatisch erzeugt von tools/build-digit-templates.js – nicht von Hand bearbeiten.
// Jede Vorlage: Ziffer, Seitenverhältnis und ${GLYPH_WIDTH}×${GLYPH_HEIGHT} Grauwerte (0 = leer bis 9 = Tinte), zeilenweise.
;((root, templates) => {
  if (typeof module !== 'undefined' && module.exports) module.exports = templates
  else root.SudokuDigitTemplates = templates
})(typeof globalThis !== 'undefined' ? globalThis : this, ${JSON.stringify(templates)})
`
  const target = join(__dirname, '..', 'digit-templates.js')
  writeFileSync(target, await prettier.format(source, { ...(await prettier.resolveConfig(target)), filepath: target }))
  console.log(`${templates.length} Vorlagen geschrieben`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
