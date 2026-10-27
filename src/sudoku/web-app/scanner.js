// Erkennt ein gedrucktes oder fotografiertes Sudoku in RGBA-Bilddaten – ohne DOM, Netzwerk oder OCR-Bibliothek.
// Bearbeitungskette: Graustufen -> Sudokuraster finden -> perspektivisch entzerren -> Zellen ausschneiden -> Ziffern per Vorlagenvergleich.
;((root, factory) => {
  const api = factory(root.SudokuDigitTemplates)
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.SudokuScanner = api
})(typeof globalThis !== 'undefined' ? globalThis : this, (browserTemplates) => {
  // Lokal gebunden: In vm-Kontexten (z. B. Jest) ist jeder Zugriff auf das globale Math in Pixelschleifen um ein Vielfaches langsamer.
  const { abs, ceil, floor, hypot, log, max, min, round, sqrt } = Math
  // Suchdurchgänge für das Raster, nacheinander bis zu einem überzeugenden Ergebnis. Ein strengerer Schwellwert trennt
  // angehängte Flächen ab; reicht das nicht, sucht der letzte Durchgang im Bild, in dem farbige Flächen hell sind (toGray, light).
  const GRID_PASSES = [
    { thresholdOffset: 0.12, light: false },
    { thresholdOffset: 0.24, light: false },
    { thresholdOffset: 0.24, light: true }
  ]
  const STRONG_GRID_SCORE = 0.85
  const WORK_SIZE = 1200 // längere Bildseite für die Rastersuche
  const CELL = 48 // Kantenlänge einer Zelle im entzerrten Raster
  const BOARD = CELL * 9
  const GLYPH_WIDTH = 12
  const GLYPH_HEIGHT = 16
  const MIN_GLYPH_SCORE = 0.4 // echte Ziffern liegen deutlich darüber, Papierknicke und Flecken deutlich darunter

  const assertImage = ({ data, width, height } = {}) => {
    if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || data.length !== width * height * 4) {
      throw new TypeError('Ungültige RGBA-Bilddaten')
    }
  }

  // RGBA -> Graustufen, dabei per Flächenmittelung auf höchstens maxSize Pixel Kantenlänge verkleinert.
  // light: statt der Helligkeit den hellsten Farbkanal verwenden. Kräftige Farben erscheinen darin fast so hell wie Papier,
  // schwarze und graue Linien bleiben dunkel.
  const toGray = (image, maxSize = WORK_SIZE, light = false) => {
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
        const red = data[offset]
        const green = data[offset + 1]
        const blue = data[offset + 2]
        sums[target] += light ? max(red, green, blue) : red * 0.299 + green * 0.587 + blue * 0.114
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
  const gridCandidates = ({ width, height }, gray, thresholdOffset) => {
    const ink = adaptiveThreshold(gray, width, height, max(4, round(max(width, height) / 150)), thresholdOffset)
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

  // Sucht im entzerrten Raster die gerade Gitterlinie nahe index·CELL: a und b sind ihre Lagen am Anfang und Ende des Rasters.
  const fitGridLine = (ink, index, horizontal) => {
    const radius = CELL >> 1
    const expected = index * CELL
    let best = { a: expected, b: expected, hits: -1 }
    for (let a = expected - radius; a <= expected + radius; a += 2) {
      for (let b = expected - radius; b <= expected + radius; b += 2) {
        let hits = 0
        for (let along = 0; along < BOARD; along += 3) {
          const across = round(a + ((b - a) * along) / BOARD)
          hits += horizontal ? ink[across * BOARD + along] : ink[along * BOARD + across]
        }
        if (hits > best.hits) best = { a, b, hits }
      }
    }
    return best
  }

  // Lineare Ausgleichsgerade durch die Lagen der inneren Linien, ausgewertet an den Außenlinien 0 und 9.
  const extrapolate = (values) => {
    const n = values.length
    const meanIndex = (n + 1) / 2
    const mean = values.reduce((sum, value) => sum + value, 0) / n
    let numerator = 0
    let denominator = 0
    values.forEach((value, offset) => {
      numerator += (offset + 1 - meanIndex) * (value - mean)
      denominator += (offset + 1 - meanIndex) ** 2
    })
    const slope = numerator / denominator
    return [mean - slope * meanIndex, mean + slope * (9 - meanIndex)]
  }

  // Hängt eine dunkle Fläche (z. B. ein Schlagschatten) am Außenrahmen, liegen die Eckpunkte der Tintenkomponente
  // auf der Fläche statt auf dem Gitter. Die inneren Linien 1–8 bleiben davon unberührt: Aus ihnen werden die
  // Außenlinien hochgerechnet. Nur deutlich abweichende Ecken werden ersetzt, sonst bleibt die Ausgangslage.
  const refineCorners = (work, corners, board) => {
    const ink = adaptiveThreshold(board, BOARD, BOARD, CELL >> 1)
    const minHits = (BOARD / 3) * 0.6
    const fit = (horizontal) => {
      const lines = Array.from({ length: 8 }, (_, offset) => fitGridLine(ink, offset + 1, horizontal))
      if (lines.some(({ hits }) => hits < minHits)) return null
      const [a0, a9] = extrapolate(lines.map(({ a }) => a))
      const [b0, b9] = extrapolate(lines.map(({ b }) => b))
      return [
        { a: a0, b: b0 },
        { a: a9, b: b9 }
      ]
    }
    const rows = fit(true)
    const columns = rows && fit(false)
    if (!columns) return corners
    // Schnittpunkt der Zeile y = a + (b - a)·x / BOARD mit der Spalte x = c + (d - c)·y / BOARD
    const intersect = (row, column) => {
      const slopeRow = (row.b - row.a) / BOARD
      const slopeColumn = (column.b - column.a) / BOARD
      const y = (row.a + slopeRow * column.a) / (1 - slopeRow * slopeColumn)
      return { x: column.a + slopeColumn * y, y }
    }
    const map = homography(
      [
        { x: 0, y: 0 },
        { x: BOARD, y: 0 },
        { x: BOARD, y: BOARD },
        { x: 0, y: BOARD }
      ],
      corners
    )
    const refined = [
      intersect(rows[0], columns[0]),
      intersect(rows[0], columns[1]),
      intersect(rows[1], columns[1]),
      intersect(rows[1], columns[0])
    ].map(({ x, y }) => map(x, y))
    const cell = sqrt(area(corners)) / 9
    const shift = max(...refined.map((point, index) => hypot(point.x - corners[index].x, point.y - corners[index].y)))
    return shift > cell * 0.25 ? refined : corners
  }

  // Gerade v = a + b·u durch die meisten Punkte [u, v]: Kandidaten verbinden je zwei von 24 gleichmäßig gewählten Punkten,
  // der Kandidat mit den meisten Punkten im Abstand von höchstens 2 Pixeln wird über diese Punkte ausgeglichen.
  // Ein Abschnitt neben der Seite (etwa ein Etikett) verkippt die Gerade so nicht.
  const fitRobustLine = (points) => {
    if (points.length < 2) return null
    const samples = Array.from({ length: 24 }, (_, index) => points[floor((index * (points.length - 1)) / 23)])
    const inliersOf = (a, b) => points.filter(([u, v]) => abs(v - a - b * u) <= 2)
    let inliers = []
    samples.forEach(([u0, v0], first) => {
      for (const [u1, v1] of samples.slice(first + 1)) {
        if (u1 === u0) continue
        const b = (v1 - v0) / (u1 - u0)
        const found = inliersOf(v0 - b * u0, b)
        if (found.length > inliers.length) inliers = found
      }
    })
    if (inliers.length < 2) return null
    const n = inliers.length
    const meanU = inliers.reduce((sum, [u]) => sum + u, 0) / n
    const meanV = inliers.reduce((sum, [, v]) => sum + v, 0) / n
    let numerator = 0
    let denominator = 0
    for (const [u, v] of inliers) {
      numerator += (u - meanU) * (v - meanV)
      denominator += (u - meanU) ** 2
    }
    const b = denominator ? numerator / denominator : 0
    return { a: meanV - b * meanU, b }
  }

  // Ecken als Schnittpunkte der vier Rahmenseiten. Jede Seite ist eine robuste Gerade durch die äußersten Tintenpixel,
  // sodass ein am Rahmen hängendes Etikett die Ecke nicht wie beim Extrempunkt nach außen zieht.
  const straightCorners = ({ pixels, corners, minX, minY, maxX, maxY }, width) => {
    const top = new Float64Array(maxX - minX + 1).fill(Infinity)
    const bottom = new Float64Array(maxX - minX + 1).fill(-Infinity)
    const left = new Float64Array(maxY - minY + 1).fill(Infinity)
    const right = new Float64Array(maxY - minY + 1).fill(-Infinity)
    for (const index of pixels) {
      const x = index % width
      const y = (index - x) / width
      top[x - minX] = min(top[x - minX], y)
      bottom[x - minX] = max(bottom[x - minX], y)
      left[y - minY] = min(left[y - minY], x)
      right[y - minY] = max(right[y - minY], x)
    }
    // äußerste Pixel zwischen zwei Ecken, ohne die Randbereiche um die Ecken selbst
    const side = (extremes, offset, from, to) => {
      const start = ceil(min(from, to) + abs(to - from) * 0.1)
      const end = floor(max(from, to) - abs(to - from) * 0.1)
      const points = []
      for (let u = start; u <= end; u += 1) if (Number.isFinite(extremes[u - offset])) points.push([u, extremes[u - offset]])
      return fitRobustLine(points)
    }
    const [tl, tr, br, bl] = corners
    const lines = [side(top, minX, tl.x, tr.x), side(right, minY, tr.y, br.y), side(bottom, minX, bl.x, br.x), side(left, minY, tl.y, bl.y)]
    if (lines.some((line) => !line)) return null
    // Schnittpunkt der waagerechten Seite y = a + b·x mit der senkrechten Seite x = c + d·y
    const intersect = (horizontal, vertical) => {
      const x = (vertical.a + vertical.b * horizontal.a) / (1 - vertical.b * horizontal.b)
      return { x, y: horizontal.a + horizontal.b * x }
    }
    const [topLine, rightLine, bottomLine, leftLine] = lines
    return [intersect(topLine, leftLine), intersect(topLine, rightLine), intersect(bottomLine, rightLine), intersect(bottomLine, leftLine)]
  }

  // Bessere Ecken für das am besten bestätigte Gitter: erst gerade Rahmenseiten, falls sie das Gitter besser treffen,
  // dann die Hochrechnung aus den inneren Linien.
  const adjustCorners = (work, best) => {
    let { corners } = best.candidate
    let { board } = best
    const straight = straightCorners(best.candidate, work.width)
    const cell = sqrt(area(corners)) / 9
    if (straight && max(...straight.map((point, index) => hypot(point.x - corners[index].x, point.y - corners[index].y))) > cell * 0.25) {
      const result = verifyGrid(work, { corners: straight })
      if (result && result.score > best.score) ({ corners, board } = { corners: straight, board: result.board })
    }
    const refined = refineCorners(work, corners, board)
    return { corners: refined, board: refined === corners ? board : warpBoard(work, refined) }
  }

  // Letzter Versuch, wenn kein Kandidat bestätigt wurde: Verdeckt oder unterbricht etwas den Rahmen an einer Ecke, liegt deren
  // Extrempunkt daneben, die geraden Rahmenseiten treffen sie trotzdem. Kandidaten am Bildrand bleiben außen vor,
  // denn bei einem angeschnittenen Raster würden die verlängerten Seiten ein Gitter vortäuschen, das nicht im Bild ist.
  const verifyStraight = (work, candidate) => {
    const { minX, minY, maxX, maxY } = candidate
    if (minX <= 0 || minY <= 0 || maxX >= work.width - 1 || maxY >= work.height - 1) return null
    const straight = straightCorners(candidate, work.width)
    return straight && verifyGrid(work, { ...candidate, corners: straight })
  }

  // Das Graubild für einen Suchdurchgang; die Variante ohne Farbflächen wird erst berechnet, wenn sie gebraucht wird.
  const passGray = (image, work, { light }) => (light ? (work.light ??= toGray(image, WORK_SIZE, true).gray) : work.gray)

  // Schritt 2: Sucht das Sudokuraster. Liefert die vier Ecken (oben links, oben rechts, unten rechts, unten links)
  // in Koordinaten des Originalbilds sowie das entzerrte Graustufenraster.
  const findGrid = (image) => {
    const work = toGray(image)
    let best = null
    const tried = []
    // Farbige Flächen können am Gitter hängen und dessen Eckpunkte verfälschen.
    // Erst bei erfolgloser Suche trennt ein strengerer Schwellwert solche Flächen ab.
    for (const pass of GRID_PASSES) {
      for (const candidate of gridCandidates(work, passGray(image, work, pass), pass.thresholdOffset).slice(0, 8)) {
        tried.push(candidate)
        const result = verifyGrid(work, candidate)
        if (!result) continue
        if (!best || result.score > best.score) best = result
        if (result.score > STRONG_GRID_SCORE) break // das größte plausible Raster gewinnt, nicht etwa ein kleines Lösungsraster
      }
      // Ein nur knapp bestätigtes Raster ist oft der Rand eines umgebenden Rechtecks, etwa eines abfotografierten Bildschirms;
      // dann haben die weiteren Durchgänge noch eine Chance, das eigentliche Gitter von angehängten Farbflächen zu trennen.
      if (best && best.score > STRONG_GRID_SCORE) break
    }
    if (!best || best.score < MIN_GRID_SCORE) {
      for (const result of tried.map((candidate) => verifyStraight(work, candidate))) {
        if (result && (!best || result.score > best.score)) best = result
      }
    }
    if (!best || best.score < MIN_GRID_SCORE) return null
    const { corners, board } = adjustCorners(work, best)
    return { corners: toImage(corners, work.scale), board, score: best.score }
  }

  // Lässt von Hand gesetzte Ecken auf das am besten bestätigte Gitter einrasten, dessen Ecken höchstens drei Viertel
  // einer Zellbreite entfernt liegen. Andernfalls bleiben die Ecken unverändert – der Nutzer hat dann bewusst korrigiert.
  const snapCorners = (image, corners) => {
    assertCorners(corners)
    const work = toGray(image)
    const scaled = corners.map(({ x, y }) => ({ x: x * work.scale, y: y * work.scale }))
    const cell = scaled.reduce((sum, point, index) => sum + hypot(scaled[(index + 1) % 4].x - point.x, scaled[(index + 1) % 4].y - point.y), 0) / 36
    const distance = (candidate) => max(...candidate.corners.map((point, index) => hypot(point.x - scaled[index].x, point.y - scaled[index].y)))
    // wie findGrid: das am besten bestätigte Gitter aus allen Durchgängen, außer schon eines ist überzeugend
    let nearest = null
    for (const pass of GRID_PASSES) {
      for (const candidate of gridCandidates(work, passGray(image, work, pass), pass.thresholdOffset)) {
        if (distance(candidate) > cell * 0.75) continue
        const result = verifyGrid(work, candidate)
        if (result && result.score >= MIN_GRID_SCORE && (!nearest || result.score > nearest.score)) nearest = result
      }
      if (nearest && nearest.score > STRONG_GRID_SCORE) break
    }
    if (nearest) return toImage(adjustCorners(work, nearest).corners, work.scale)
    return corners.map(({ x, y }) => ({ x, y }))
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

  // Perspektivische Abbildung von Rasterkoordinaten (0 bis 9 je Achse) auf die Ecken des Rasters im Bild.
  const gridMap = (corners) => {
    const square = [
      { x: 0, y: 0 },
      { x: 9, y: 0 },
      { x: 9, y: 9 },
      { x: 0, y: 9 }
    ]
    const map = homography(square, corners)
    if (!map) throw new TypeError('Die Ecken spannen kein Viereck auf')
    return map
  }

  // Bildlage von Punkten in Rasterkoordinaten, z. B. { x: 3, y: 0 } für den oberen Endpunkt der ersten Blocklinie.
  // Anders als lineares Interpolieren zwischen den Ecken berücksichtigt das die Perspektive.
  const gridToImage = (corners, points) => {
    assertCorners(corners)
    const map = gridMap(corners)
    return points.map(({ x, y }) => map(x, y))
  }

  // Lage der 81 Zellen im Originalbild als affine Matrizen [a, b, c, d, e, f] (wie SVG matrix()): Sie bilden die
  // Einheitszelle mit Mittelpunkt (0, 0) auf die perspektivisch verzerrte Zelle ab. rotation stammt aus
  // recognizeDigits und dreht die Zuordnung so, dass Zeile und Spalte zum aufrecht gelesenen Sudoku passen.
  const cellTransforms = (corners, rotation = 0) => {
    assertCorners(corners)
    if (!Number.isInteger(rotation) || rotation < 0 || rotation > 3) throw new TypeError('Ungültige Drehung')
    const map = gridMap(corners.map((_, index) => corners[(index - rotation + 4) % 4]))
    return Array.from({ length: 81 }, (_, index) => {
      const u = (index % 9) + 0.5
      const v = floor(index / 9) + 0.5
      const center = map(u, v)
      const [left, right, top, bottom] = [map(u - 0.5, v), map(u + 0.5, v), map(u, v - 0.5), map(u, v + 0.5)]
      return [right.x - left.x, right.y - left.y, bottom.x - top.x, bottom.y - top.y, center.x, center.y]
    })
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
  const extractGlyphs = (board, thresholdOffset = 0.18) => {
    const ink = adaptiveThreshold(board, BOARD, BOARD, CELL >> 1, thresholdOffset)
    const margin = round(CELL * 0.04)
    const inner = CELL - 2 * margin
    return Array.from({ length: 81 }, (_, index) => {
      const left = (index % 9) * CELL + margin
      const top = floor(index / 9) * CELL + margin
      const cell = new Uint8Array(inner * inner)
      for (let y = 0; y < inner; y += 1) for (let x = 0; x < inner; x += 1) cell[y * inner + x] = ink[(top + y) * BOARD + left + x]

      // Gitterlinien berühren den Zellrand und laufen fast durch die ganze Zelle oder liegen überwiegend direkt am Rand.
      // Eine Ziffer ist hoch genug und liegt ungefähr in der Mitte; sie darf den Rand berühren, weil große oder
      // verschobene Zeitungsziffern bis dorthin reichen.
      const atEdge = (pixel) => {
        const x = pixel % inner
        const y = (pixel - x) / inner
        return x <= 1 || y <= 1 || x >= inner - 2 || y >= inner - 2
      }
      const pieces = components(cell, inner, inner).filter((part) => {
        const width = part.maxX - part.minX + 1
        const height = part.maxY - part.minY + 1
        const touchesEdge = part.minX === 0 || part.minY === 0 || part.maxX === inner - 1 || part.maxY === inner - 1
        return !(touchesEdge && (width > inner * 0.8 || height > inner * 0.8 || part.pixels.filter(atEdge).length > part.count * 0.4))
      })
      const candidates = pieces.filter(
        (part) =>
          part.maxY - part.minY + 1 >= inner * 0.22 &&
          abs((part.minX + part.maxX) / 2 - inner / 2) < inner * 0.3 &&
          abs((part.minY + part.maxY) / 2 - inner / 2) < inner * 0.3
      )
      if (!candidates.length) return null
      const main = candidates.reduce((best, part) => (part.count > best.count ? part : best))
      const box = { minX: main.minX, minY: main.minY, maxX: main.maxX, maxY: main.maxY }
      // Bruchstücke derselben Ziffer (z. B. ein unterbrochener Querbalken) mit aufnehmen, auch wenn sie klein sind – aber nur,
      // wenn sie direkt angrenzen und innerhalb des leicht erweiterten Ziffernrahmens liegen. So kommen weder Flecken
      // noch angrenzende Linienreste dazu.
      const slack = round(inner * 0.15)
      const glyphParts = [main]
      for (const part of pieces) {
        if (part === main) continue
        if (part.minX < main.minX - slack || part.maxX > main.maxX + slack || part.minY < main.minY - slack || part.maxY > main.maxY + slack) continue
        if (part.maxX < main.minX - 2 || part.minX > main.maxX + 2 || part.maxY < main.minY - 2 || part.minY > main.maxY + 2) continue
        glyphParts.push(part)
        box.minX = min(box.minX, part.minX)
        box.minY = min(box.minY, part.minY)
        box.maxX = max(box.maxX, part.maxX)
        box.maxY = max(box.maxY, part.maxY)
      }
      const mask = new Uint8Array(cell.length)
      for (const part of glyphParts) for (const pixel of part.pixels) mask[pixel] = 1
      return normalizeGlyph(mask, inner, box)
    })
  }

  // Zieht den Mittelwert ab und liefert die Norm dazu. So muss die Korrelation je Vergleich nur noch ein Skalarprodukt bilden.
  const centered = (values) => {
    let mean = 0
    for (let index = 0; index < values.length; index += 1) mean += values[index]
    mean /= values.length
    const result = new Float64Array(values.length)
    let square = 0
    for (let index = 0; index < values.length; index += 1) {
      result[index] = values[index] - mean
      square += result[index] * result[index]
    }
    return { values: result, square }
  }

  // Dekodierte Vorlagen je Vorlagensatz nur einmal berechnen; recognizeDigits wird für jedes Foto erneut aufgerufen.
  const decodedTemplates = new WeakMap()
  const decodeTemplates = (templates) => {
    if (!decodedTemplates.has(templates)) {
      const decoded = templates.map(({ digit, aspect, values }) => ({
        digit,
        aspect,
        ...centered(Float32Array.from(values, (char) => Number(char) / 9))
      }))
      decodedTemplates.set(templates, decoded)
    }
    return decodedTemplates.get(templates)
  }

  // Korrelation zweier mit centered vorbereiteter Wertefolgen
  const correlation = (left, right) => {
    let product = 0
    for (let index = 0; index < left.values.length; index += 1) product += left.values[index] * right.values[index]
    return left.square && right.square ? product / sqrt(left.square * right.square) : 0
  }

  // Schritt 3b: Vergleicht eine Ziffer mit allen Vorlagen. Liefert die Ziffern absteigend nach Ähnlichkeit.
  const classifyGlyph = (glyph, templates) => {
    const scores = Array(10).fill(-Infinity)
    const values = centered(glyph.values)
    for (const template of templates) {
      const score = correlation(values, template) - 0.5 * abs(log(glyph.aspect / template.aspect))
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
      fit += best.score
      count += 1
      if (best.score < MIN_GLYPH_SCORE) return
      grid[index] = best.digit
      confidence[index] = max(0, min(1, best.score - (second?.score ?? 0)))
    })
    // Blasse, dünne Ziffern können beim ersten Schwellwert verschwinden. Nur sehr eindeutige
    // Vorlagentreffer nachtragen, damit Bleistiftreste und Papierflecken keine Zahlen erzeugen.
    extractGlyphs(board, 0.1).forEach((glyph, index) => {
      if (grid[index] || !glyph) return
      const [best, second] = classifyGlyph(glyph, templates)
      const margin = best.score - (second?.score ?? 0)
      if (best.score < 0.7 || margin < 0.3) return
      grid[index] = best.digit
      confidence[index] = min(1, margin)
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

  return {
    GLYPH_WIDTH,
    GLYPH_HEIGHT,
    cellTransforms,
    extractGlyphs,
    findGrid,
    gridToImage,
    gridToString,
    normalizeGlyph,
    recognizeDigits,
    scanSudoku,
    snapCorners,
    warpCorners
  }
})
