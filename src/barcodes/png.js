const fs = require('fs')
const zlib = require('zlib')

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

// Minimaler Reader für 8-Bit-Graustufen ohne Zeilenfilter - mehr brauchen die Scan-Fixtures nicht
const readPng = (filePath) => {
  const file = fs.readFileSync(filePath)
  if (!file.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`Not a PNG file: ${filePath}`)

  let offset = 8
  let width = 0
  let height = 0
  const idat = []

  while (offset < file.length) {
    const length = file.readUInt32BE(offset)
    const type = file.subarray(offset + 4, offset + 8).toString('ascii')
    const chunk = file.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') [width, height] = [chunk.readUInt32BE(0), chunk.readUInt32BE(4)]
    else if (type === 'IDAT') idat.push(chunk)
    else if (type === 'IEND') break
  }

  const inflated = zlib.inflateSync(Buffer.concat(idat))
  const rowSize = width + 1
  const data = new Uint8ClampedArray(width * height)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize
    if (inflated[rowOffset] !== 0) throw new Error(`Unsupported PNG filter ${inflated[rowOffset]}`)
    for (let x = 0; x < width; x++) data[y * width + x] = inflated[rowOffset + 1 + x]
  }

  return { width, height, data }
}

module.exports = { readPng }
