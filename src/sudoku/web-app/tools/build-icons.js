// Erzeugt src/sudoku/web-app/apple-touch-icon.png (180 × 180) aus favicon.svg.
// iOS rundet die Ecken selbst ab und füllt Transparenz schwarz, deshalb wird die Fläche hier randlos gefüllt.
// Aufruf: node src/sudoku/web-app/tools/build-icons.js (benötigt sharp)
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const sharp = require('sharp')

const SIZE = 180
const svg = readFileSync(join(__dirname, '..', 'favicon.svg'), 'utf8').replace(/ rx="\d+"/, '')

sharp(Buffer.from(svg), { density: (72 * SIZE) / 64 })
  .resize(SIZE, SIZE)
  .flatten({ background: '#17201d' })
  .png()
  .toFile(join(__dirname, '..', 'apple-touch-icon.png'))
  .then(() => console.log(`apple-touch-icon.png (${SIZE} × ${SIZE}) geschrieben`))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
