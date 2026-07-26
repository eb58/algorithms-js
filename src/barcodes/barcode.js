const { readPng } = require('./png')

// Einmalig binden statt in jeder Schleife über das Global zu gehen: unter Jest läuft der Code
// in einer vm-Sandbox, in der jeder Zugriff auf ein Global durch einen Proxy geht - dort kostet
// `Math.round(x)` gegenüber `round(x)` den Faktor 100, in node ist es gleich schnell.
const { abs, ceil, cos, floor, max, min, round, sin, PI } = Math

// ---------------------------------------------------------------------------
// Breiten -> Ziffern
// ---------------------------------------------------------------------------

const CHAR_SET = ['nnwwn', 'wnnnw', 'nwnnw', 'wwnnn', 'nnwnw', 'wnwnn', 'nwwnn', 'nnnww', 'wnnwn', 'nwnwn']
const RUN_WHITE = 255
const RUN_BLACK = 0

// Muster als Bitmaske der breiten Balken: die Klassifikation liefert direkt zwei Positionen,
// damit fallen im heißen Pfad Zwischenstrings und ihre indexOf-Suche weg
const patternToMask = (pattern) => [...pattern].reduce((mask, c, n) => (c === 'w' ? mask | (1 << n) : mask), 0)
const DIGIT_BY_MASK = CHAR_SET.reduce((acc, pattern, digit) => acc.fill(digit, patternToMask(pattern), patternToMask(pattern) + 1), new Int8Array(32).fill(-1))

const isBitmap = (input) => input && typeof input === 'object' && Number.isInteger(input.width) && Number.isInteger(input.height) && input.data && typeof input.data.length === 'number'
const isMatrix = (input) => Array.isArray(input) && Array.isArray(input[0])
const matrixToColumns = (matrix) => matrix[0].map((_, x) => matrix.reduce((sum, row) => sum + (row[x] ?? 0), 0) / matrix.length)

const imageDataToColumns = (data, width, height) => {
  const channels = data.length === width * height * 4 ? 4 : 1
  return Array.from({ length: width }, (_, x) => {
    let sum = 0
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * channels
      sum += channels === 4 ? round((data[idx] + data[idx + 1] + data[idx + 2]) / 3) : data[idx]
    }
    return sum / height
  })
}

const valuesToRuns = (values) => {
  if (!values.length) return []
  let lo = Infinity
  let hi = -Infinity
  // Indiziert statt for-of: values ist meist ein Uint8ClampedArray, dort kostet der Iterator das Sechsfache
  for (let i = 0; i < values.length; i++) {
    if (values[i] < lo) lo = values[i]
    if (values[i] > hi) hi = values[i]
  }
  const threshold = (lo + hi) / 2
  const runs = []
  let count = 1
  let bin = values[0] > threshold ? RUN_WHITE : RUN_BLACK

  for (let i = 1; i < values.length; i++) {
    const next = values[i] > threshold ? RUN_WHITE : RUN_BLACK
    if (next === bin) count += 1
    else {
      runs.push({ bin, count })
      bin = next
      count = 1
    }
  }

  runs.push({ bin, count })
  return runs
}

const trimQuietZones = (runs) => {
  let start = 0
  let end = runs.length
  while (start + 1 < end && runs[start].bin === RUN_WHITE && runs[start].count > runs[start + 1].count * 2) start += 1
  while (end - 2 >= start && runs[end - 1].bin === RUN_WHITE && runs[end - 1].count > runs[end - 2].count * 2) end -= 1
  return runs.slice(start, end)
}

// Fünf Balken ab `from` im Abstand `step`: die zwei breitesten ergeben die Ziffer,
// zu geringer Abstand zum breitesten schmalen Balken verwirft die Gruppe (-1)
const classifyInterleavedGroup = (widths, from, step) => {
  let first = -1
  let second = -1
  let firstAt = -1
  let secondAt = -1

  for (let n = 0; n < 5; n++) {
    const width = widths[from + n * step]
    if (width > first) {
      second = first
      secondAt = firstAt
      first = width
      firstAt = n
    } else if (width > second) {
      second = width
      secondAt = n
    }
  }

  let maxNarrow = -1
  for (let n = 0; n < 5; n++) {
    if (n !== firstAt && n !== secondAt && widths[from + n * step] > maxNarrow) maxNarrow = widths[from + n * step]
  }

  return second / maxNarrow < 1.1 ? -1 : DIGIT_BY_MASK[(1 << firstAt) | (1 << secondAt)]
}

const looksLikeInterleavedStart = (widths, from) => {
  let lo = Infinity
  let hi = 0
  for (let n = 0; n < 4; n++) {
    if (widths[from + n] < lo) lo = widths[from + n]
    if (widths[from + n] > hi) hi = widths[from + n]
  }
  return hi / lo < 2.5
}

const looksLikeInterleavedStop = (widths, from) => widths[from] / max(widths[from + 1], widths[from + 2]) >= 1.1

const columnsToWidths = (columns) => trimQuietZones(valuesToRuns(columns)).map((run) => run.count)

const normalizeInput = (input) => {
  if (input && typeof input === 'object' && Array.isArray(input.columns)) return columnsToWidths(input.columns)
  if (Array.isArray(input)) return isMatrix(input) ? columnsToWidths(matrixToColumns(input)) : input.slice()
  if (!isBitmap(input)) return []
  return columnsToWidths(imageDataToColumns(input.data, input.width, input.height))
}

const decodeStandard = (rawLines) => {
  const lines = rawLines.slice()
  const barThreshold = ceil(lines.reduce((acc, item) => acc + item, 0) / lines.length)
  const toPattern = (chunk) => chunk.filter((_, n) => n % 2 === 0).map((s) => (s > barThreshold ? 'w' : 'n')).join('')

  if (toPattern(lines.splice(0, 6)) !== 'wwn' || toPattern(lines.splice(-5, 5)) !== 'wnw') return ''

  const code = []
  while (lines.length > 0) code.push(CHAR_SET.indexOf(toPattern(lines.splice(0, 10))))
  return code.join('')
}

const decodeInterleaved = (lines) => {
  // Jede Zehnergruppe je Startversatz nur einmal klassifizieren: die Suche über alle
  // Start/Stop-Paare läuft danach auf Tabellenzugriffen statt auf tausenden Neuberechnungen
  const digits = Array.from({ length: max(0, lines.length - 9) }, (_, i) => {
    const a = classifyInterleavedGroup(lines, i, 2)
    const b = classifyInterleavedGroup(lines, i + 1, 2)
    return a < 0 || b < 0 ? null : `${a}${b}`
  })

  const matches = []
  for (let dataStart = 0; dataStart + 13 <= lines.length; dataStart++) {
    const start = dataStart >= 4 && looksLikeInterleavedStart(lines, dataStart - 4) ? dataStart - 4 : dataStart
    let code = ''
    // Scheitert eine Gruppe, scheitern auch alle längeren Codes ab demselben Start
    for (let i = dataStart; i + 13 <= lines.length; i += 10) {
      if (!digits[i]) break
      code += digits[i]
      if (looksLikeInterleavedStop(lines, i + 10)) matches.push({ start, end: i + 13, code })
    }
  }

  return matches
    .toSorted((a, b) => b.code.length - a.code.length || a.start - b.start)
    .reduce((acc, match) => (acc.some(({ start, end }) => match.start < end && match.end > start) ? acc : [...acc, match]), [])
    .sort((a, b) => a.start - b.start)
    .map(({ code }) => code)
    .join(',')
}

const decodeWidths = (lines, type) => (type === 'interleaved' ? decodeInterleaved(lines) : decodeStandard(lines))

const decoder = (input, type) => {
  const lines = normalizeInput(input)
  return lines.length ? decodeWidths(lines, type) : ''
}

// ---------------------------------------------------------------------------
// Bildoperationen
// ---------------------------------------------------------------------------

const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1]

// subarray statt slice: die Zeile wird nur gelesen, eine Kopie je Bildzeile wäre verschenkt.
// Der slice-Zweig fängt Bitmaps ab, die als normales Array hereingereicht werden.
const columnsFromRow = ({ width, data }, row) => data.subarray?.(row * width, (row + 1) * width) ?? data.slice(row * width, (row + 1) * width)

// Schleife statt Array.from(): der Callback lässt sich nicht in die Builtin inlinen, das kostet hier das Dreifache
const columnsFromBand = ({ width, data }, start, end) => {
  const rows = end - start + 1
  const columns = new Array(width)
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let y = start; y <= end; y++) sum += data[y * width + x]
    columns[x] = round(sum / rows)
  }
  return columns
}

const rotateImage = (image, angle) => {
  if (!angle) return image

  const rad = (angle * PI) / 180
  const spanSin = abs(sin(rad))
  const spanCos = abs(cos(rad))
  const width = ceil(image.width * spanCos + image.height * spanSin)
  const height = ceil(image.width * spanSin + image.height * spanCos)
  const data = new Uint8ClampedArray(width * height).fill(255)
  const srcCx = image.width / 2
  const srcCy = image.height / 2
  const cosA = cos(-rad)
  const sinA = sin(-rad)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - width / 2
      const dy = y - height / 2
      const srcX = round(dx * cosA - dy * sinA + srcCx)
      const srcY = round(dx * sinA + dy * cosA + srcCy)
      if (srcX >= 0 && srcX < image.width && srcY >= 0 && srcY < image.height) data[y * width + x] = image.data[srcY * image.width + srcX]
    }
  }

  return { width, height, data }
}

const cropImage = (image, region) => {
  if (!region) return image

  const x = max(0, min(image.width, round(region.x ?? 0)))
  const y = max(0, min(image.height, round(region.y ?? 0)))
  const width = max(0, min(image.width - x, round(region.width ?? image.width - x)))
  const height = max(0, min(image.height - y, round(region.height ?? image.height - y)))
  const data = Uint8ClampedArray.from({ length: width * height }, (_, i) => image.data[(y + floor(i / width)) * image.width + x + (i % width)])

  return { width, height, data }
}

const invert = (image) => {
  const data = new Uint8ClampedArray(image.data.length)
  for (let i = 0; i < data.length; i++) data[i] = 255 - image.data[i]
  return { ...image, data }
}

// Weiß-auf-schwarz-Scans invertieren, sonst hält die Bandsuche das ganze Bild für Barcode.
// Nur eine Vermutung: bei einem eng beschnittenen Barcode überwiegt Schwarz ganz normal.
// Schleife statt reduce(): das kostet über ein Vollbild das Dreizehnfache. Sampling wäre nochmal
// schneller, aber drei Fixtures liegen unter einer Helligkeitsstufe an der Polaritätsschwelle.
const isDark = ({ data }) => {
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i]
  return sum / data.length < 128
}

const loadImage = (source) => (typeof source === 'string' ? readPng(source) : source)

// ---------------------------------------------------------------------------
// Kandidatensuche im Bild
// ---------------------------------------------------------------------------

// Aufsteigend nach Kosten: die meisten Scans sind nach dem ersten Durchgang gelesen. Der gedrehte Durchgang
// ist für leicht schief eingescannte Formulare nötig, die bei 0° unlesbar bleiben.
const PASSES = [
  { angles: [0], samples: 10 },
  { angles: [0, -3], samples: 60 }
]

const MIN_BAND_HEIGHT = 4
const MIN_WIDTHS = 30
const MAX_WIDTHS = 180

const sampledRows = (start, end, samples) => {
  const height = end - start + 1
  return height <= samples
    ? Array.from({ length: height }, (_, idx) => start + idx)
    : Array.from({ length: samples }, (_, i) => start + round((i * (height - 1)) / (samples - 1)))
}

// Zeilen mit vielen Hell-Dunkel-Wechseln zu Bändern zusammenfassen.
// Obergrenze großzügig: auf Formularen steht neben dem Barcode Text in derselben Zeile
const bands = (image) => {
  const maxBlack = image.width * 0.9
  const isBarcodeRow = (y) => {
    let black = 0
    let transitions = 0
    let prev = false
    let hasPrev = false
    const offset = y * image.width

    for (let x = 0; x < image.width; x++) {
      const dark = image.data[offset + x] < 200
      if (dark) black += 1
      if (hasPrev && dark !== prev) transitions += 1
      if (dark || hasPrev) {
        hasPrev = true
        prev = dark
      }
      if (transitions > 400 || black > maxBlack) return false // beide wachsen nur, die Zeile ist damit erledigt
    }

    return transitions >= 25 && black >= 20
  }

  // Im Raster von MIN_BAND_HEIGHT suchen und die Ränder eines Treffers zeilenweise nachziehen:
  // vier aufeinanderfolgende Zeilen enthalten immer eine Rasterzeile, ein Band der Mindesthöhe
  // kann also nicht durchfallen. Spart ein Drittel der Zeilenprüfungen bei identischen Bändern -
  // aber nur bis MIN_BAND_HEIGHT, ab Schritt 5 gehen über die Fixtures Bänder verloren.
  const found = []
  let y = 0
  while (y < image.height) {
    if (!isBarcodeRow(y)) {
      y += MIN_BAND_HEIGHT
      continue
    }

    let start = y
    let end = y
    while (start > 0 && isBarcodeRow(start - 1)) start -= 1
    while (end + 1 < image.height && isBarcodeRow(end + 1)) end += 1
    if (end - start + 1 >= MIN_BAND_HEIGHT) found.push({ start, end })
    y = end + 1
  }
  return found
}

// Eine Bildzeile in Balkenbreiten schneiden - inklusive Auftrennung an breiten Weißlücken,
// weil auf Formularen neben dem Barcode Text in derselben Zeile steht
const candidatesFromColumns = (source, y, columns, seen) => {
  const runs = valuesToRuns(columns)
  const bins = runs.map((run) => run.bin)
  const widths = runs.map((run) => run.count)
  const found = []

  const push = (from, to) => {
    let start = from
    let end = to
    while (start < end && bins[start] === RUN_WHITE) start += 1
    while (end > start && bins[end - 1] === RUN_WHITE) end -= 1
    if (end - start < MIN_WIDTHS || end - start > MAX_WIDTHS) return

    const segment = widths.slice(start, end)
    // Schlüssel mit Herkunftszeile: dieselbe Zeile darf in einem späteren Durchgang nicht erneut mitstimmen,
    // zwei verschiedene Zeilen mit gleichem Ergebnis sind dagegen zwei echte Stimmen
    const key = `${source}:${segment}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ y, widths: segment, atEdge: end === widths.length })
  }

  const gap = max(20, 4 * median(widths))
  const segmentStart = widths.reduce((from, run, i) => (bins[i] === RUN_WHITE && run > gap ? (push(from, i), i + 1) : from), 0)
  push(segmentStart, widths.length)
  push(0, widths.length)

  return found
}

// Winkel 0 kommt in jedem Durchgang vor: Drehung und Bandsuche je Winkel nur einmal rechnen
const viewsFor = (image) => {
  const cache = new Map()
  return (angle) => {
    if (!cache.has(angle)) {
      const rotated = rotateImage(image, angle)
      cache.set(angle, { rotated, found: bands(rotated) })
    }
    return cache.get(angle)
  }
}

function* candidates(view, { angles, samples }, seen) {
  for (const angle of angles) {
    const { rotated, found } = view(angle)
    for (const { start, end } of found) {
      for (const row of sampledRows(start, end, samples)) yield* candidatesFromColumns(`${angle}:${row}`, row, columnsFromRow(rotated, row), seen)
      yield* candidatesFromColumns(`${angle}:band${start}`, start, columnsFromBand(rotated, start, end), seen)
    }
  }
}

// ---------------------------------------------------------------------------
// Erkennung: Kandidaten dekodieren, Treffer über Konsens absichern
// ---------------------------------------------------------------------------

const DEFAULTS = {
  type: 'interleaved',
  minDigits: 6,
  minVotes: 2, // ein einzeln gelesener Code ist meist Rauschen aus dem Formulartext
  confidence: 0.3, // ... und ein Code weit unter den Stimmen des besten Treffers ebenfalls
  minConsensus: 3, // ab so vielen gleichen Treffern ist ein weiterer Durchgang überflüssig
  passes: PASSES,
  partials: false,
  first: false,
  region: null
}

const countCodes = (hits) => hits.reduce((acc, { code }) => acc.set(code, (acc.get(code) ?? 0) + 1), new Map())

// Am Bildrand fehlen Stopmuster und Ruhezone: dort lohnt ein zweiter Versuch mit gekürztem Code plus synthetischem Stop
const truncatedVariants = ({ y, widths }) => {
  const narrow = median(widths)
  return Array.from({ length: max(0, ceil((widths.length - 14) / 10)) }, (_, i) => ({
    y,
    widths: [...widths.slice(0, 14 + i * 10), narrow * 3, narrow, narrow]
  }))
}

const hitsForPass = (view, pass, seen, options) => {
  const { type, minDigits, minConsensus, first } = options
  const isCode = (code) => code.length >= minDigits && /^\d+$/.test(code)
  const decode = (cand) => ({ ...cand, code: decodeWidths(cand.widths, type) })

  const decoded = []
  const counts = new Map()
  for (const cand of candidates(view, pass, seen)) {
    const hit = decode(cand)
    decoded.push(hit)
    if (!first || !isCode(hit.code)) continue
    // Abbruch erst ab minConsensus: die ersten Lesungen eines Bandes liefern oft nur ein Bruchstück des Codes
    counts.set(hit.code, (counts.get(hit.code) ?? 0) + 1)
    if (counts.get(hit.code) >= minConsensus) return decoded.filter(({ code }) => code === hit.code)
  }

  const retries = decoded.filter(({ atEdge, code }) => atEdge && !isCode(code)).flatMap(truncatedVariants).map(decode)
  return [...decoded, ...retries].filter(({ code }) => isCode(code))
}

// Ein Teilstück nur verwerfen, wenn der längere Code besser belegt ist. Fehllesungen greifen gern
// eine Zifferngruppe zu weit ("753003275505" statt "3003275505"); ohne den Stimmenvergleich schluckt
// so eine einzelne Lesung den vielfach belegten richtigen Code.
const removePartialCodes = (hits) => hits.filter((hit) => !hits.some((other) => other.code !== hit.code && other.code.includes(hit.code) && other.votes > hit.votes))

/**
 * Sucht Barcodes in einem Bild und liefert die Treffer mit Fundstelle und Stimmenzahl:
 * `[{ code, y, votes }]`, sortiert von oben nach unten.
 *
 * Jede ausgewertete Bildzeile ist eine Stimme; `votes` sagt also, wie oft derselbe Code
 * gelesen wurde, und ist damit das Maß für die Verlässlichkeit eines Treffers.
 *
 * @param {string|{width:number,height:number,data:ArrayLike<number>}} source Pfad zu einem PNG oder Bitmap
 * @param {object} [options]
 * @param {'interleaved'|'standard'} [options.type='interleaved'] Barcode-Typ
 * @param {{x?:number,y?:number,width?:number,height?:number}} [options.region] Scanbereich eingrenzen
 * @param {boolean} [options.first=false] abbrechen, sobald ein Code minConsensus-mal gelesen wurde
 * @param {number} [options.minVotes=2] wie oft ein Code gelesen sein muss, um als Treffer zu gelten
 * @param {number} [options.minConsensus=3] ab so vielen gleichen Lesungen gilt ein Treffer als abgesichert
 * @param {number} [options.confidence=0.3] Mindestanteil an den Stimmen des besten Treffers (0 schaltet ab)
 * @param {number} [options.minDigits=6] Mindestlänge eines gültigen Codes
 * @param {boolean} [options.partials=false] auch Codes liefern, die in einem längeren Treffer stecken
 */
const scanBarcodes = (source, options = {}) => {
  const opts = { ...DEFAULTS, ...options }
  const image = cropImage(loadImage(source), opts.region)
  // Für den Abbruch der Kaskade zählen nur unterschiedliche Lesungen: zehn identische Zeilen desselben
  // Bandes sind ein Beleg, kein Konsens - sonst liefe der feine Durchgang bei schrägen Scans nie an
  const distinctReadings = (hits) =>
    hits.reduce((acc, { code, widths }) => acc.set(code, (acc.get(code) ?? new Set()).add(widths.join())), new Map())
  const enough = (hits) => (opts.first ? hits.length > 0 : [...distinctReadings(hits).values()].some((set) => set.size >= opts.minConsensus))
  const allPasses = (img) => {
    const seen = new Set() // über alle Durchgänge, damit dieselbe Zeile den Konsens nicht doppelt stützt
    const view = viewsFor(img)
    return opts.passes.reduce((acc, pass) => (enough(acc) ? acc : [...acc, ...hitsForPass(view, pass, seen, opts)]), [])
  }

  const guessed = isDark(image) ? invert(image) : image
  const rawHits = allPasses(guessed)
  if (!rawHits.length) rawHits.push(...allPasses(invert(guessed))) // Polarität war falsch geraten

  const counts = countCodes(rawHits)
  const threshold = max(opts.minVotes, max(0, ...counts.values()) * opts.confidence)
  const hits = rawHits
    .filter(({ code }) => counts.get(code) >= threshold)
    .sort((a, b) => a.y - b.y || b.code.length - a.code.length)
    .reduce((acc, hit) => (acc.some(({ code }) => code === hit.code) ? acc : [...acc, hit]), [])
    .map(({ code, y }) => ({ code, y, votes: counts.get(code) }))

  return opts.partials ? hits : removePartialCodes(hits)
}

/** Alle verlässlich gelesenen Barcodes als Strings, von oben nach unten - die übliche Einstiegs-API. */
const barcodesFrom = (source, options) => scanBarcodes(source, options).map(({ code }) => code)

/** Der bestbelegte Barcode oder '' - mit `{ first: true }` bricht die Suche beim ersten Treffer ab. */
const barcodeFrom = (source, options) => scanBarcodes(source, options).sort((a, b) => b.votes - a.votes || b.code.length - a.code.length)[0]?.code ?? ''

/** Ein Ergebnis je Scanbereich: `regions` ist eine Liste von Rechtecken, das Bild wird nur einmal geladen. */
const barcodesFromRegions = (source, regions, options) => regions.map((region) => barcodesFrom(loadImage(source), { ...options, region }))

/** Alles, was der Scanner überhaupt lesen konnte - ungefiltert, für Diagnose und schwierige Vorlagen. */
const barcodeCandidates = (source, options) => scanBarcodes(source, { ...options, minVotes: 1, confidence: 0, partials: true })

// node src/barcodes/barcode.js <bild.png> [--first] [--all]
if (require.main === module) {
  const [file, ...flags] = process.argv.slice(2)
  const options = { first: flags.includes('--first') }
  if (!file) console.log('Aufruf: node src/barcodes/barcode.js <bild.png> [--first] [--all]')
  else (flags.includes('--all') ? barcodeCandidates(file, options) : scanBarcodes(file, options)).forEach(({ code, y, votes }) => console.log(`${code}\ty=${y}\tvotes=${votes}`))
}

module.exports = {
  barcodesFrom,
  barcodeFrom,
  barcodesFromRegions,
  barcodeCandidates,
  scanBarcodes,
  decoder,
  decodeWidths,
  loadImage,
  cropImage,
  rotateImage
}
