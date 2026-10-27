// Bildoperationen, die Rastersuche (scanner.js) und Ziffernerkennung (digits.js) gemeinsam nutzen – ohne DOM.
;((root, factory) => {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.SudokuImageOps = api
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  // Lokal gebunden: In vm-Kontexten (z. B. Jest) ist jeder Zugriff auf das globale Math in Pixelschleifen um ein Vielfaches langsamer.
  const { max, min } = Math
  const CELL = 48 // Kantenlänge einer Zelle im entzerrten Raster
  const BOARD = CELL * 9

  // Adaptiver Schwellwert: Ein Pixel ist "Tinte", wenn es deutlich dunkler als seine Umgebung ist.
  const adaptiveThreshold = (gray, width, height, radius, offset = 0.12) => {
    const integral = new Float64Array((width + 1) * (height + 1))
    for (let y = 0; y < height; y += 1) {
      let rowSum = 0
      for (let x = 0; x < width; x += 1) {
        rowSum += gray[y * width + x]
        integral[(y + 1) * (width + 1) + x + 1] = integral[y * (width + 1) + x + 1] + rowSum
      }
    }
    const ink = new Uint8Array(width * height)
    for (let y = 0; y < height; y += 1) {
      const top = max(0, y - radius)
      const bottom = min(height, y + radius + 1)
      for (let x = 0; x < width; x += 1) {
        const left = max(0, x - radius)
        const right = min(width, x + radius + 1)
        const sum =
          integral[bottom * (width + 1) + right] -
          integral[top * (width + 1) + right] -
          integral[bottom * (width + 1) + left] +
          integral[top * (width + 1) + left]
        const mean = sum / ((bottom - top) * (right - left))
        ink[y * width + x] = gray[y * width + x] < mean * (1 - offset) ? 1 : 0
      }
    }
    return ink
  }

  // Zusammenhängende Tintenbereiche (8er-Nachbarschaft) mit Begrenzungsrahmen und Eckpunkten.
  const components = (ink, width, height) => {
    const labels = new Int32Array(ink.length).fill(-1)
    const stack = new Int32Array(ink.length)
    const result = []
    for (let start = 0; start < ink.length; start += 1) {
      if (!ink[start] || labels[start] >= 0) continue
      const component = { minX: width, minY: height, maxX: 0, maxY: 0, count: 0, pixels: [] }
      // Extrempunkte der Diagonalen liefern die vier Ecken eines (verzerrten) Quadrats.
      const corners = { tl: [0, 0, Infinity], tr: [0, 0, -Infinity], br: [0, 0, -Infinity], bl: [0, 0, Infinity] }
      let size = 0
      stack[size++] = start
      labels[start] = result.length
      while (size) {
        const index = stack[--size]
        const x = index % width
        const y = (index - x) / width
        component.count += 1
        component.pixels.push(index)
        if (x < component.minX) component.minX = x
        if (x > component.maxX) component.maxX = x
        if (y < component.minY) component.minY = y
        if (y > component.maxY) component.maxY = y
        if (x + y < corners.tl[2]) corners.tl = [x, y, x + y]
        if (x + y > corners.br[2]) corners.br = [x, y, x + y]
        if (x - y > corners.tr[2]) corners.tr = [x, y, x - y]
        if (x - y < corners.bl[2]) corners.bl = [x, y, x - y]
        for (let dy = -1; dy <= 1; dy += 1) {
          const ny = y + dy
          if (ny < 0 || ny >= height) continue
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx
            if (nx < 0 || nx >= width) continue
            const neighbor = ny * width + nx
            if (!ink[neighbor] || labels[neighbor] >= 0) continue
            labels[neighbor] = result.length
            stack[size++] = neighbor
          }
        }
      }
      component.corners = [corners.tl, corners.tr, corners.br, corners.bl].map(([x, y]) => ({ x, y }))
      result.push(component)
    }
    return result
  }

  return { BOARD, CELL, adaptiveThreshold, components }
})
