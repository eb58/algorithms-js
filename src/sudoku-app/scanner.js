// Erkennt ein gedrucktes oder fotografiertes Sudoku in RGBA-Bilddaten – ohne DOM, Netzwerk oder OCR-Bibliothek.
// Bearbeitungskette: Graustufen -> Sudokuraster finden -> perspektivisch entzerren -> Zellen ausschneiden -> Ziffern per Vorlagenvergleich.
;((root, factory) => {
  const api = factory(root.SudokuDigitTemplates)
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.SudokuScanner = api
})(typeof globalThis !== 'undefined' ? globalThis : this, (browserTemplates) => {
  // Lokal gebunden: In vm-Kontexten (z. B. Jest) ist jeder Zugriff auf das globale Math in Pixelschleifen um ein Vielfaches langsamer.
  const { abs, ceil, floor, hypot, log, max, min, round, sqrt } = Math
  const WORK_SIZE = 1200 // längere Bildseite für die Rastersuche
  const CELL = 48 // Kantenlänge einer Zelle im entzerrten Raster
  const BOARD = CELL * 9
  const GLYPH_WIDTH = 12
  const GLYPH_HEIGHT = 16

  const assertImage = ({ data, width, height } = {}) => {
    if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || data.length !== width * height * 4) {
      throw new TypeError('Ungültige RGBA-Bilddaten')
    }
  }

  // RGBA -> Graustufen, dabei per Flächenmittelung auf höchstens maxSize Pixel Kantenlänge verkleinert.
  const toGray = (image, maxSize = WORK_SIZE) => {
    assertImage(image)
    const { data, width, height } = image
    const scale = min(1, maxSize / max(width, height))
    const outWidth = max(1, round(width * scale))
    const outHeight = max(1, round(height * scale))
    const sums = new Float64Array(outWidth * outHeight)
    const counts = new Uint32Array(outWidth * outHeight)
    const targetColumns = Int32Array.from({ length: width }, (_, x) => min(outWidth - 1, floor(x * scale)))
    let offset = 0
    for (let y = 0; y < height; y += 1) {
      const row = min(outHeight - 1, floor(y * scale)) * outWidth
      for (let x = 0; x < width; x += 1, offset += 4) {
        const target = row + targetColumns[x]
        sums[target] += data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114
        counts[target] += 1
      }
    }
    const gray = new Uint8Array(outWidth * outHeight)
    for (let index = 0; index < gray.length; index += 1) gray[index] = round(sums[index] / counts[index])
    return { gray, width: outWidth, height: outHeight, scale }
  }

  const assertCorners = (corners) => {
    if (!Array.isArray(corners) || corners.length !== 4 || corners.some((point) => !Number.isFinite(point?.x) || !Number.isFinite(point?.y))) {
      throw new TypeError('Es werden genau vier Eckpunkte erwartet')
    }
  }

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

  // Löst das lineare Gleichungssystem a·x = b (Gauß mit Spaltenpivotisierung).
  const solveLinear = (a, b) => {
    const n = b.length
    const m = a.map((row, index) => [...row, b[index]])
    for (let column = 0; column < n; column += 1) {
      let pivot = column
      for (let row = column + 1; row < n; row += 1) if (abs(m[row][column]) > abs(m[pivot][column])) pivot = row
      ;[m[column], m[pivot]] = [m[pivot], m[column]]
      if (abs(m[column][column]) < 1e-12) return null
      for (let row = 0; row < n; row += 1) {
        if (row === column) continue
        const factor = m[row][column] / m[column][column]
        for (let k = column; k <= n; k += 1) m[row][k] -= factor * m[column][k]
      }
    }
    return m.map((row, index) => row[n] / row[index])
  }

  // Homographie, die die Punkte from[i] auf to[i] abbildet (je vier Punkte).
  const homography = (from, to) => {
    const a = []
    const b = []
    from.forEach(({ x, y }, index) => {
      const { x: u, y: v } = to[index]
      a.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
      b.push(u)
      a.push([0, 0, 0, x, y, 1, -v * x, -v * y])
      b.push(v)
    })
    const h = solveLinear(a, b)
    if (!h) return null
    return (x, y) => {
      const w = h[6] * x + h[7] * y + 1
      return { x: (h[0] * x + h[1] * y + h[2]) / w, y: (h[3] * x + h[4] * y + h[5]) / w }
    }
  }

  // Entzerrt das Viereck corners (im Graustufenbild) auf ein BOARD×BOARD-Quadrat, bilinear interpoliert.
  const warpBoard = ({ gray, width, height }, corners) => {
    const square = [
      { x: 0, y: 0 },
      { x: BOARD, y: 0 },
      { x: BOARD, y: BOARD },
      { x: 0, y: BOARD }
    ]
    const map = homography(square, corners)
    if (!map) return null
    const board = new Uint8Array(BOARD * BOARD)
    for (let y = 0; y < BOARD; y += 1) {
      for (let x = 0; x < BOARD; x += 1) {
        const source = map(x + 0.5, y + 0.5)
        const sx = min(width - 1.001, max(0, source.x - 0.5))
        const sy = min(height - 1.001, max(0, source.y - 0.5))
        const x0 = floor(sx)
        const y0 = floor(sy)
        const fx = sx - x0
        const fy = sy - y0
        const top = gray[y0 * width + x0] * (1 - fx) + gray[y0 * width + x0 + 1] * fx
        const bottom = gray[(y0 + 1) * width + x0] * (1 - fx) + gray[(y0 + 1) * width + x0 + 1] * fx
        board[y * BOARD + x] = round(top * (1 - fy) + bottom * fy)
      }
    }
    return board
  }

  // Anteil der erwarteten Block- und Außenlinien (Positionen 0, 3, 6, 9), die im entzerrten Raster als Tinte vorhanden sind.
  const gridLineScore = (ink) => {
    const tolerance = 3
    let total = 0
    let hits = 0
    for (const line of [0, 3, 6, 9]) {
      const position = min(BOARD - 1, line * CELL)
      for (let along = 0; along < BOARD; along += 2) {
        let horizontal = 0
        let vertical = 0
        for (let offset = -tolerance; offset <= tolerance; offset += 1) {
          const across = position + offset
          if (across < 0 || across >= BOARD) continue
          horizontal ||= ink[across * BOARD + along]
          vertical ||= ink[along * BOARD + across]
        }
        hits += horizontal + vertical
        total += 2
      }
    }
    return hits / total
  }

  const area = (corners) => {
    let sum = 0
    corners.forEach((point, index) => {
      const next = corners[(index + 1) % corners.length]
      sum += point.x * next.y - next.x * point.y
    })
    return abs(sum) / 2
  }

  // Zusammenhängende, ungefähr quadratische und nur dünn gefüllte Tintenbereiche – mögliche Gitter, größte zuerst.
  // Ihre Ecken liegen in Koordinaten des verkleinerten Arbeitsbilds.
  const gridCandidates = ({ gray, width, height }) => {
    const ink = adaptiveThreshold(gray, width, height, max(4, round(max(width, height) / 150)))
    const minSide = min(width, height) * 0.2
    return components(ink, width, height)
      .filter((component) => {
        const boxWidth = component.maxX - component.minX + 1
        const boxHeight = component.maxY - component.minY + 1
        const ratio = boxWidth / boxHeight
        const fill = component.count / (boxWidth * boxHeight)
        return boxWidth >= minSide && boxHeight >= minSide && ratio > 0.6 && ratio < 1.6 && fill < 0.4
      })
      .sort((left, right) => area(right.corners) - area(left.corners))
  }

  const toImage = (corners, scale) => corners.map(({ x, y }) => ({ x: x / scale, y: y / scale }))

  // Bewertet ein mögliches Gitter anhand seiner Block- und Außenlinien im entzerrten Bild.
  const verifyGrid = (work, candidate) => {
    const board = warpBoard(work, candidate.corners)
    return board && { candidate, board, score: gridLineScore(adaptiveThreshold(board, BOARD, BOARD, CELL >> 1)) }
  }
  const MIN_GRID_SCORE = 0.6

  // Schritt 2: Sucht das Sudokuraster. Liefert die vier Ecken (oben links, oben rechts, unten rechts, unten links)
  // in Koordinaten des Originalbilds sowie das entzerrte Graustufenraster.
  const findGrid = (image) => {
    const work = toGray(image)
    let best = null
    for (const candidate of gridCandidates(work).slice(0, 8)) {
      const result = verifyGrid(work, candidate)
      if (!result) continue
      if (!best || result.score > best.score) best = result
      if (result.score > 0.85) break // das größte plausible Raster gewinnt, nicht etwa ein kleines Lösungsraster
    }
    if (!best || best.score < MIN_GRID_SCORE) return null
    return { corners: toImage(best.candidate.corners, work.scale), board: best.board, score: best.score }
  }

  // Lässt von Hand gesetzte Ecken auf das am besten bestätigte Gitter einrasten, dessen Ecken höchstens drei Viertel
  // einer Zellbreite entfernt liegen. Andernfalls bleiben die Ecken unverändert – der Nutzer hat dann bewusst korrigiert.
  const snapCorners = (image, corners) => {
    assertCorners(corners)
    const work = toGray(image)
    const scaled = corners.map(({ x, y }) => ({ x: x * work.scale, y: y * work.scale }))
    const cell = scaled.reduce((sum, point, index) => sum + hypot(scaled[(index + 1) % 4].x - point.x, scaled[(index + 1) % 4].y - point.y), 0) / 36
    const distance = (candidate) => max(...candidate.corners.map((point, index) => hypot(point.x - scaled[index].x, point.y - scaled[index].y)))
    const nearest = gridCandidates(work)
      .filter((candidate) => distance(candidate) <= cell * 0.75)
      .map((candidate) => verifyGrid(work, candidate))
      .filter((result) => result && result.score >= MIN_GRID_SCORE)
      .sort((left, right) => right.score - left.score)[0]
    return nearest ? toImage(nearest.candidate.corners, work.scale) : corners.map(({ x, y }) => ({ x, y }))
  }

  // Entzerrt ein Raster mit vorgegebenen Ecken (z. B. von Hand korrigiert) in Koordinaten des Originalbilds.
  const warpCorners = (image, corners) => {
    assertCorners(corners)
    const work = toGray(image)
    return warpBoard(
      work,
      corners.map(({ x, y }) => ({ x: x * work.scale, y: y * work.scale }))
    )
  }

  // Bringt einen Ziffernausschnitt (Tintenmaske, Rahmen inklusive) auf GLYPH_WIDTH×GLYPH_HEIGHT Werte zwischen 0 und 1.
  const normalizeGlyph = (ink, width, { minX, minY, maxX, maxY }) => {
    const glyphWidth = maxX - minX + 1
    const glyphHeight = maxY - minY + 1
    const values = new Float32Array(GLYPH_WIDTH * GLYPH_HEIGHT)
    for (let gy = 0; gy < GLYPH_HEIGHT; gy += 1) {
      const y0 = minY + (gy * glyphHeight) / GLYPH_HEIGHT
      const y1 = minY + ((gy + 1) * glyphHeight) / GLYPH_HEIGHT
      for (let gx = 0; gx < GLYPH_WIDTH; gx += 1) {
        const x0 = minX + (gx * glyphWidth) / GLYPH_WIDTH
        const x1 = minX + ((gx + 1) * glyphWidth) / GLYPH_WIDTH
        let sum = 0
        let weight = 0
        for (let y = floor(y0); y < ceil(y1); y += 1) {
          const wy = min(y + 1, y1) - max(y, y0)
          for (let x = floor(x0); x < ceil(x1); x += 1) {
            const w = (min(x + 1, x1) - max(x, x0)) * wy
            sum += ink[y * width + x] * w
            weight += w
          }
        }
        values[gy * GLYPH_WIDTH + gx] = weight ? sum / weight : 0
      }
    }
    return { values, aspect: glyphWidth / glyphHeight }
  }

  // Schritt 3a: Schneidet aus dem entzerrten Raster die Ziffern aus. Leere Zellen ergeben null.
  const extractGlyphs = (board) => {
    const ink = adaptiveThreshold(board, BOARD, BOARD, CELL >> 1, 0.18)
    const margin = round(CELL * 0.12)
    const inner = CELL - 2 * margin
    return Array.from({ length: 81 }, (_, index) => {
      const left = (index % 9) * CELL + margin
      const top = floor(index / 9) * CELL + margin
      const cell = new Uint8Array(inner * inner)
      for (let y = 0; y < inner; y += 1) for (let x = 0; x < inner; x += 1) cell[y * inner + x] = ink[(top + y) * BOARD + left + x]

      // Gitterlinienreste berühren den Zellrand; eine Ziffer ist hoch genug und liegt ungefähr in der Mitte.
      const parts = components(cell, inner, inner).filter(
        (part) =>
          part.minX > 0 &&
          part.minY > 0 &&
          part.maxX < inner - 1 &&
          part.maxY < inner - 1 &&
          part.maxY - part.minY + 1 >= inner * 0.35 &&
          abs((part.minX + part.maxX) / 2 - inner / 2) < inner * 0.3 &&
          abs((part.minY + part.maxY) / 2 - inner / 2) < inner * 0.3
      )
      if (!parts.length) return null
      const main = parts.reduce((best, part) => (part.count > best.count ? part : best))
      const box = { minX: main.minX, minY: main.minY, maxX: main.maxX, maxY: main.maxY }
      // Kleinere Teile derselben Ziffer (z. B. bei dünner, unterbrochener Schrift) mit aufnehmen.
      for (const part of parts) {
        if (part === main || part.maxX < box.minX - 2 || part.minX > box.maxX + 2) continue
        box.minX = min(box.minX, part.minX)
        box.minY = min(box.minY, part.minY)
        box.maxX = max(box.maxX, part.maxX)
        box.maxY = max(box.maxY, part.maxY)
      }
      const mask = new Uint8Array(cell.length)
      for (const part of parts) for (const pixel of part.pixels) mask[pixel] = 1
      return normalizeGlyph(mask, inner, box)
    })
  }

  const decodeTemplates = (templates) =>
    templates.map(({ digit, aspect, values }) => ({ digit, aspect, values: Float32Array.from(values, (char) => Number(char) / 9) }))

  const correlation = (left, right) => {
    const n = left.length
    let meanLeft = 0
    let meanRight = 0
    for (let index = 0; index < n; index += 1) {
      meanLeft += left[index]
      meanRight += right[index]
    }
    meanLeft /= n
    meanRight /= n
    let product = 0
    let squareLeft = 0
    let squareRight = 0
    for (let index = 0; index < n; index += 1) {
      const a = left[index] - meanLeft
      const b = right[index] - meanRight
      product += a * b
      squareLeft += a * a
      squareRight += b * b
    }
    return squareLeft && squareRight ? product / sqrt(squareLeft * squareRight) : 0
  }

  // Schritt 3b: Vergleicht eine Ziffer mit allen Vorlagen. Liefert die Ziffern absteigend nach Ähnlichkeit.
  const classifyGlyph = (glyph, templates) => {
    const scores = Array(10).fill(-Infinity)
    for (const template of templates) {
      const score = correlation(glyph.values, template.values) - 0.5 * abs(log(glyph.aspect / template.aspect))
      if (score > scores[template.digit]) scores[template.digit] = score
    }
    return scores
      .map((score, digit) => ({ digit, score }))
      .filter(({ score }) => score > -Infinity)
      .sort((left, right) => right.score - left.score)
  }

  // Dreht das entzerrte Raster um 90° im Uhrzeigersinn.
  const rotateBoard = (board) => {
    const rotated = new Uint8Array(board.length)
    for (let y = 0; y < BOARD; y += 1) for (let x = 0; x < BOARD; x += 1) rotated[y * BOARD + x] = board[(BOARD - 1 - x) * BOARD + y]
    return rotated
  }

  const readGlyphs = (board, templates) => {
    const grid = Array(81).fill(0)
    const confidence = Array(81).fill(1)
    let fit = 0
    let count = 0
    extractGlyphs(board).forEach((glyph, index) => {
      if (!glyph) return
      const [best, second] = classifyGlyph(glyph, templates)
      grid[index] = best.digit
      confidence[index] = max(0, min(1, best.score - (second?.score ?? 0)))
      fit += best.score
      count += 1
    })
    return { grid, confidence, fit: count ? fit / count : 0 }
  }

  // Schritt 3: Entzerrtes Raster -> { grid, confidence, rotation }. 0 steht für eine leere Zelle; confidence ist der
  // Abstand zur zweitbesten Ziffer (0 = unentschieden, leere Zellen 1). Liegt das Rätsel im Foto quer oder auf dem Kopf
  // (z. B. flach fotografiert), gewinnt die Ausrichtung, deren Ziffern am besten zu den Vorlagen passen;
  // rotation gibt an, um wie viele Vierteldrehungen im Uhrzeigersinn das Raster dafür gedreht wurde.
  const recognizeDigits = (board, templates = defaultTemplates()) => {
    const decoded = decodeTemplates(templates)
    let best = null
    let current = board
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const result = { ...readGlyphs(current, decoded), rotation }
      if (!best || result.fit > best.fit) best = result
      current = rotateBoard(current)
    }
    const { grid, confidence, rotation } = best
    return { grid, confidence, rotation }
  }

  // Gesamte Kette: RGBA-Bild -> { grid, confidence, corners } oder null, wenn kein Raster gefunden wurde.
  const scanSudoku = (image, templates = defaultTemplates()) => {
    const found = findGrid(image)
    return found && { ...recognizeDigits(found.board, templates), corners: found.corners }
  }

  const defaultTemplates = () => {
    const templates = browserTemplates ?? (typeof require === 'function' ? require('./digit-templates') : null)
    if (!templates) throw new Error('Ziffernvorlagen fehlen (digit-templates.js laden)')
    return templates
  }

  const gridToString = (grid) => {
    if (!Array.isArray(grid) || grid.length !== 81 || grid.some((value) => !Number.isInteger(value) || value < 0 || value > 9)) {
      throw new TypeError('Ungültiges Sudoku-Raster')
    }
    return grid.map((value) => value || '.').join('')
  }

  return { GLYPH_WIDTH, GLYPH_HEIGHT, extractGlyphs, findGrid, gridToString, normalizeGlyph, recognizeDigits, scanSudoku, snapCorners, warpCorners }
})
