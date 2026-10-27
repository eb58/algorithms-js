// Ziffernerkennung ohne OCR-Bibliothek: Entzerrtes Raster -> Ziffern per Vorlagenvergleich.
// Die Rastersuche davor übernimmt scanner.js; gemeinsame Bildoperationen liegen in image-ops.js.
;((root, factory) => {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./image-ops'))
  else root.SudokuDigits = factory(root.SudokuImageOps, root.SudokuDigitTemplates)
})(typeof globalThis !== 'undefined' ? globalThis : this, ({ BOARD, CELL, adaptiveThreshold, components }, browserTemplates) => {
  // Lokal gebunden: In vm-Kontexten (z. B. Jest) ist jeder Zugriff auf das globale Math in Pixelschleifen um ein Vielfaches langsamer.
  const { abs, ceil, floor, log, max, min, round, sqrt } = Math
  const GLYPH_WIDTH = 12
  const GLYPH_HEIGHT = 16
  const MIN_GLYPH_SCORE = 0.4 // echte Ziffern liegen deutlich darüber, Papierknicke und Flecken deutlich darunter

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
  const extractGlyphs = (board, thresholdOffset = 0.18, indices = Array.from({ length: 81 }, (_, index) => index)) => {
    const ink = adaptiveThreshold(board, BOARD, BOARD, CELL >> 1, thresholdOffset)
    const margin = round(CELL * 0.04)
    const inner = CELL - 2 * margin
    return indices.map((index) => {
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

  // Geschlossene Innenflächen ergänzen den Pixelvergleich: Eine offene 3 darf nicht
  // allein wegen ihrer rechten Bögen fast so gut zu einer 8 passen. Nur über mehrere
  // Schwellwerte stabile Löcher zählen; winzige Rasterungsartefakte bleiben außen vor.
  const enclosedAreas = (values) => {
    const counts = [0.35, 0.5, 0.65].map((threshold) => {
      const visited = new Uint8Array(values.length)
      const stack = []
      let holes = 0
      for (let start = 0; start < values.length; start += 1) {
        if (visited[start] || values[start] >= threshold) continue
        visited[start] = 1
        stack.push(start)
        let size = 0
        let border = false
        while (stack.length) {
          const index = stack.pop()
          const x = index % GLYPH_WIDTH
          const y = floor(index / GLYPH_WIDTH)
          size += 1
          border ||= x === 0 || y === 0 || x === GLYPH_WIDTH - 1 || y === GLYPH_HEIGHT - 1
          for (const next of [x > 0 ? index - 1 : -1, x < GLYPH_WIDTH - 1 ? index + 1 : -1, index - GLYPH_WIDTH, index + GLYPH_WIDTH]) {
            if (next < 0 || next >= values.length || visited[next] || values[next] >= threshold) continue
            visited[next] = 1
            stack.push(next)
          }
        }
        if (!border && size >= 3) holes += 1
      }
      return holes
    })
    return counts.every((count) => count === counts[0]) ? counts[0] : null
  }

  // Dekodierte Vorlagen je Vorlagensatz nur einmal berechnen; recognizeDigits wird für jedes Foto erneut aufgerufen.
  const decodedTemplates = new WeakMap()
  const decodeTemplates = (templates) => {
    if (!decodedTemplates.has(templates)) {
      const decoded = templates.map(({ digit, aspect, values }) => {
        const pixels = Float32Array.from(values, (char) => Number(char) / 9)
        return { digit, aspect, holes: enclosedAreas(pixels), ...centered(pixels) }
      })
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
    const holes = enclosedAreas(glyph.values)
    for (const template of templates) {
      const topologyPenalty = holes === null || template.holes === null ? 0 : 0.05 * min(2, abs(holes - template.holes))
      const score = correlation(values, template) - 0.5 * abs(log(glyph.aspect / template.aspect)) - topologyPenalty
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

  // Knapp unsichere Treffer erst nach Wahl der Drehlage prüfen. Die Durchgänge sind
  // korreliert: Ihre Abstände nicht addieren und klare Mehrdeutigkeit nicht aufwerten.
  const confirmUncertain = (board, templates, grid, confidence) => {
    const minMargin = 0.075
    const pending = grid.flatMap((digit, index) => (digit && confidence[index] >= minMargin && confidence[index] < 0.1 ? [index] : []))
    if (!pending.length) return
    const passes = [0.18, 0.14, 0.22].map((offset) => extractGlyphs(board, offset, pending))
    pending.forEach((index, position) => {
      const stable = passes.every((glyphs) => {
        const glyph = glyphs[position]
        if (!glyph) return false
        const [best, second] = classifyGlyph(glyph, templates)
        return best.digit === grid[index] && best.score >= 0.85 && best.score - (second?.score ?? 0) >= minMargin
      })
      // Nur bis an die bestehende Warnschwelle anheben; keine Wahrscheinlichkeit.
      if (stable) confidence[index] = 0.1
    })
  }

  // Schritt 3: Entzerrtes Raster -> { grid, confidence, rotation }. 0 steht für eine leere Zelle; confidence ist der
  // Abstand zur zweitbesten Ziffer (0 = unentschieden, leere Zellen 1), bei stabilen,
  // hochwertigen Treffern über drei Schwellwerte mindestens 0.1. Liegt das Rätsel im Foto quer oder auf dem Kopf
  // (z. B. flach fotografiert), gewinnt die Ausrichtung, deren Ziffern am besten zu den Vorlagen passen;
  // rotation gibt an, um wie viele Vierteldrehungen im Uhrzeigersinn das Raster dafür gedreht wurde.
  const recognizeDigits = (board, templates = defaultTemplates()) => {
    const decoded = decodeTemplates(templates)
    let best = null
    let current = board
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const result = { ...readGlyphs(current, decoded), rotation, board: current }
      if (!best || result.fit > best.fit) best = result
      current = rotateBoard(current)
    }
    const { grid, confidence, rotation } = best
    confirmUncertain(best.board, decoded, grid, confidence)
    return { grid, confidence, rotation }
  }

  const defaultTemplates = () => {
    const templates = browserTemplates ?? (typeof require === 'function' ? require('./digit-templates') : null)
    if (!templates) throw new Error('Ziffernvorlagen fehlen (digit-templates.js laden)')
    return templates
  }

  return {
    GLYPH_WIDTH,
    GLYPH_HEIGHT,
    enclosedAreas,
    extractGlyphs,
    normalizeGlyph,
    recognizeDigits
  }
})
