// Erzeugt src/sudoku/web-app/digit-templates.js aus gerenderten Ziffern gängiger Schriften.
// Aufruf: node src/sudoku/web-app/tools/build-digit-templates.js (benötigt sharp und die genannten Systemschriften)
const { writeFileSync } = require('node:fs')
const { join } = require('node:path')
const prettier = require('prettier')
const sharp = require('sharp')
const { GLYPH_HEIGHT, GLYPH_WIDTH, normalizeGlyph } = require('../digits')

// Schriften mit Normalziffern. Bewusst nicht dabei: Mediävalziffern (Georgia, Candara, Constantia, Corbel, Sitka),
// Segoe-Ableger mit gleichen Ziffern (Gadugi, Ebrima, Leelawadee, Nirmala) und Schreibmaschinenschriften (Consolas, Courier).
// Ein Kreuztest, bei dem jede Schrift einmal als unbekannte Schrift ausgelassen wird, erkannte damit alle Ziffern richtig.
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
  'Times New Roman;font-weight:bold',
  'Franklin Gothic Medium',
  'Bahnschrift',
  'Bahnschrift;font-weight:bold',
  'Roboto',
  'Roboto;font-weight:bold',
  'Microsoft Sans Serif',
  'Malgun Gothic',
  'Malgun Gothic;font-weight:bold',
  'Trebuchet MS',
  'Trebuchet MS;font-weight:bold',
  'Lucida Sans Unicode',
  'Segoe UI Variable',
  'Segoe UI Variable;font-weight:bold',
  'Cambria',
  'Cambria;font-weight:bold',
  'Palatino Linotype',
  'Palatino Linotype;font-weight:bold',
  'Sylfaen',
  'Impact'
]
const SIZE = 160

// Fehlt eine Schrift, ersetzt librsvg sie stillschweigend. monospace als Ersatz kommt in FONTS nicht vor und lässt sich
// deshalb erkennen.
const render = async (font, digit) => {
  const [family, ...rest] = font.split(';')
  const style = [`font-family:'${family}',monospace`, 'font-size:110px', ...rest].join(';')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="100%" height="100%" fill="white"/><text x="40" y="125" style="${style}">${digit}</text></svg>`
  return sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true })
}

// Geprüft wird die Familie im normalen Schnitt; ein fehlender Fettschnitt wird aus derselben Familie erzeugt.
const assertInstalled = async (family) => {
  const missing = await render('Nicht installierte Schrift', 5)
  if ((await render(family, 5)).data.equals(missing.data)) throw new Error(`Schrift ${family} ist nicht installiert`)
}

const renderDigit = async (font, digit) => {
  const { data, info } = await render(font, digit)
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
  for (const family of new Set(FONTS.map((font) => font.split(';')[0]))) await assertInstalled(family)
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
