;(() => {
  'use strict'

  const MAX_FILE_SIZE = 20 * 1024 * 1024
  const MIN_SIDE = 300
  const MAX_PIXELS = 24e6 // größere Fotos werden vor der Erkennung verkleinert
  const DISPLAY_SIZE = 1100
  const UNCERTAIN = 0.1 // Mindestabstand zur zweitbesten Ziffer, darunter gilt eine Erkennung als unsicher

  const $ = (selector) => document.querySelector(selector)
  const elements = {
    file: $('#file-input'),
    drop: $('#drop-zone'),
    cropStage: $('#crop-stage'),
    frame: $('#photo-frame'),
    canvas: $('#photo-canvas'),
    selection: $('#selection'),
    handles: [...document.querySelectorAll('.handle')],
    photoActions: $('#photo-actions'),
    recognize: $('#recognize-button'),
    reset: $('#reset-button'),
    empty: $('#empty-state'),
    sudokuWrap: $('#sudoku-wrap'),
    grid: $('#sudoku-grid'),
    status: $('#grid-status'),
    solve: $('#solve-button'),
    clear: $('#clear-button')
  }

  const state = {
    pixels: null, // RGBA-Daten des Fotos, auf denen der Scanner arbeitet
    corners: null, // Ecken des Gitters (oben links, oben rechts, unten rechts, unten links) in Pixeln von state.pixels
    original: Array(81).fill(0),
    drag: null
  }

  const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value))

  const loadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Bitte eine Bilddatei wählen', 'bad')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus('Bild ist größer als 20 MB', 'bad')
      return
    }

    const url = URL.createObjectURL(file)
    try {
      const image = await loadImage(url)
      if (image.naturalWidth < MIN_SIDE || image.naturalHeight < MIN_SIDE) {
        setStatus('Bildauflösung ist zu klein', 'bad')
        return
      }
      state.pixels = readPixels(image)
      drawPhoto(image)
      elements.drop.hidden = true
      elements.cropStage.hidden = false
      elements.photoActions.hidden = false
      elements.reset.hidden = false
      setStatus('Raster wird gesucht …', 'neutral')
      await nextFrame()

      const found = SudokuScanner.findGrid(state.pixels)
      state.corners = found ? found.corners : defaultCorners()
      renderSelection()
      setStep(2)
      if (found) setStatus('Ausschnitt prüfen', 'neutral')
      else setStatus('Kein Raster gefunden – Ecken setzen', 'warn')
    } catch (error) {
      console.error(error)
      setStatus('Bild konnte nicht gelesen werden', 'bad')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const readPixels = (image) => {
    const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (image.naturalWidth * image.naturalHeight)))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return context.getImageData(0, 0, canvas.width, canvas.height)
  }

  const drawPhoto = (image) => {
    const scale = Math.min(1, DISPLAY_SIZE / Math.max(image.naturalWidth, image.naturalHeight))
    elements.canvas.width = Math.round(image.naturalWidth * scale)
    elements.canvas.height = Math.round(image.naturalHeight * scale)
    elements.canvas.getContext('2d').drawImage(image, 0, 0, elements.canvas.width, elements.canvas.height)
  }

  const defaultCorners = () => {
    const { width, height } = state.pixels
    const size = Math.min(width, height) * 0.8
    const left = (width - size) / 2
    const top = (height - size) / 2
    return [
      { x: left, y: top },
      { x: left + size, y: top },
      { x: left + size, y: top + size },
      { x: left, y: top + size }
    ]
  }

  // Das SVG verwendet die Pixelkoordinaten des Fotos als viewBox und skaliert dadurch mit der Anzeige.
  const renderSelection = () => {
    const { width, height } = state.pixels
    const corners = state.corners
    const lerp = (from, to, t) => `${from.x + (to.x - from.x) * t} ${from.y + (to.y - from.y) * t}`
    const outline = `M${corners.map(({ x, y }) => `${x} ${y}`).join('L')}Z`
    const guides = [1 / 3, 2 / 3]
      .map(
        (t) =>
          `M${lerp(corners[0], corners[1], t)}L${lerp(corners[3], corners[2], t)}M${lerp(corners[0], corners[3], t)}L${lerp(corners[1], corners[2], t)}`
      )
      .join('')

    elements.selection.setAttribute('viewBox', `0 0 ${width} ${height}`)
    elements.selection.querySelector('.shade').setAttribute('d', `M0 0H${width}V${height}H0Z${outline}`)
    elements.selection.querySelector('.guides').setAttribute('d', guides)
    elements.selection.querySelector('.frame').setAttribute('points', corners.map(({ x, y }) => `${x},${y}`).join(' '))
    elements.handles.forEach((handle, index) => {
      handle.style.left = `${(corners[index].x / width) * 100}%`
      handle.style.top = `${(corners[index].y / height) * 100}%`
    })
  }

  const pointerPosition = (event) => {
    const rect = elements.frame.getBoundingClientRect()
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * state.pixels.width, 0, state.pixels.width),
      y: clamp(((event.clientY - rect.top) / rect.height) * state.pixels.height, 0, state.pixels.height)
    }
  }

  // Ein Griff verschiebt seine Ecke, ein Zug im Rahmen verschiebt alle vier Ecken.
  const startDrag = (event) => {
    if (!state.corners) return
    event.preventDefault()
    const corner = event.target.dataset.corner
    state.drag = {
      corner: corner === undefined ? null : Number(corner),
      start: pointerPosition(event),
      corners: state.corners.map((point) => ({ ...point }))
    }
    event.target.setPointerCapture?.(event.pointerId)
  }

  const moveDrag = (event) => {
    if (!state.drag) return
    const position = pointerPosition(event)
    if (state.drag.corner !== null) {
      state.corners[state.drag.corner] = position
    } else {
      const xs = state.drag.corners.map(({ x }) => x)
      const ys = state.drag.corners.map(({ y }) => y)
      const dx = clamp(position.x - state.drag.start.x, -Math.min(...xs), state.pixels.width - Math.max(...xs))
      const dy = clamp(position.y - state.drag.start.y, -Math.min(...ys), state.pixels.height - Math.max(...ys))
      state.corners = state.drag.corners.map(({ x, y }) => ({ x: x + dx, y: y + dy }))
    }
    renderSelection()
  }

  // Nach dem Loslassen rastet der Rahmen auf ein nahe gelegenes Gitter ein.
  const endDrag = () => {
    if (!state.drag) return
    state.drag = null
    try {
      state.corners = SudokuScanner.snapCorners(state.pixels, state.corners)
      renderSelection()
    } catch (error) {
      console.error(error)
    }
  }

  const recognizeGrid = async () => {
    if (!state.pixels || !state.corners) return
    elements.recognize.disabled = true
    setStatus('Ziffern werden erkannt …', 'neutral')
    await nextFrame()
    try {
      const { grid, confidence } = SudokuScanner.recognizeDigits(SudokuScanner.warpCorners(state.pixels, state.corners))
      const sanitized = Sudoku.sanitizeRecognition(grid, confidence)
      for (const index of sanitized.removed) confidence[index] = 0
      state.original = sanitized.grid.slice()
      setStep(3)
      showGrid(sanitized.grid, confidence)
    } catch (error) {
      console.error(error)
      setStatus('Erkennung fehlgeschlagen', 'bad')
    } finally {
      elements.recognize.disabled = false
    }
  }

  const buildGrid = () => {
    for (let index = 0; index < 81; index += 1) {
      const input = document.createElement('input')
      input.className = 'cell'
      input.inputMode = 'numeric'
      input.maxLength = 1
      input.setAttribute('aria-label', `Zeile ${Math.floor(index / 9) + 1}, Spalte ${(index % 9) + 1}`)
      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^1-9]/g, '').slice(-1)
        input.className = input.value ? 'cell recognized' : 'cell'
        validateInputs()
      })
      input.addEventListener('keydown', (event) => navigateGrid(event, index))
      elements.grid.appendChild(input)
    }
  }

  const showGrid = (values, confidence = Array(81).fill(1), solved = false) => {
    const inputs = [...elements.grid.children]
    inputs.forEach((input, index) => {
      const value = values[index]
      input.value = value || ''
      const wasGiven = state.original[index] > 0
      input.className = !value ? 'cell' : solved && !wasGiven ? 'cell solved' : confidence[index] < UNCERTAIN ? 'cell uncertain' : 'cell recognized'
    })
    elements.empty.hidden = true
    elements.sudokuWrap.hidden = false
    validateInputs()
  }

  const readGrid = () => {
    return [...elements.grid.children].map((input) => Number(input.value) || 0)
  }

  const validateInputs = () => {
    const grid = readGrid()
    const filled = grid.filter(Boolean).length
    const valid = Sudoku.validate(grid)
    elements.solve.disabled = !valid || filled < 17
    if (!valid) setStatus('Widerspruch im Raster', 'bad')
    else if (filled < 17) setStatus(`${filled} Zahlen · bitte prüfen`, 'warn')
    else setStatus(`${filled} Zahlen · bereit`, 'good')
  }

  const solveGrid = () => {
    const input = readGrid()
    const solutions = Sudoku.countSolutions(input)
    if (solutions === 0) {
      setStatus('Keine Lösung – Zahlen prüfen', 'bad')
      return
    }
    if (solutions > 1) {
      setStatus('Mehrere Lösungen – fehlen Zahlen?', 'warn')
      return
    }
    const solution = Sudoku.solve(input)
    state.original = input.slice()
    showGrid(solution, Array(81).fill(1), true)
    setStatus('Gelöst', 'good')
    setStep(4)
  }

  const navigateGrid = (event, index) => {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }
    if (!(event.key in moves)) return
    event.preventDefault()
    elements.grid.children[Math.max(0, Math.min(80, index + moves[event.key]))].focus()
  }

  const setStep = (current) => {
    document.querySelectorAll('.steps li').forEach((step) => {
      const number = Number(step.dataset.step)
      step.classList.toggle('active', number === current)
      step.classList.toggle('done', number < current)
    })
  }

  const setStatus = (text, kind) => {
    elements.status.textContent = text
    elements.status.className = `status ${kind}`
  }

  const reset = () => {
    state.pixels = null
    state.corners = null
    state.drag = null
    state.original.fill(0)
    elements.file.value = ''
    elements.drop.hidden = false
    elements.cropStage.hidden = true
    elements.photoActions.hidden = true
    elements.reset.hidden = true
    showGrid(Array(81).fill(0))
    elements.sudokuWrap.hidden = true
    elements.empty.hidden = false
    setStatus('Noch kein Foto', 'neutral')
    setStep(1)
  }

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Bild konnte nicht dekodiert werden'))
      image.src = url
    })
  }

  const nextFrame = () => {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))
  }

  const loadFixture = async () => {
    const filename = new URLSearchParams(globalThis.location.search).get('fixture')
    if (!filename) return
    if (!/^[\w.-]+\.(?:jpe?g|png|webp)$/i.test(filename)) {
      setStatus('Ungültiger Fixture-Dateiname', 'bad')
      return
    }

    try {
      const response = await fetch(`./fixtures/${encodeURIComponent(filename)}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      await loadFile(new File([blob], filename, { type: blob.type }))
    } catch (error) {
      console.error(error)
      setStatus('Fixture konnte nicht geladen werden', 'bad')
    }
  }

  buildGrid()

  elements.file.addEventListener('change', () => loadFile(elements.file.files[0]))
  elements.drop.addEventListener('dragover', (event) => {
    event.preventDefault()
    elements.drop.classList.add('dragging')
  })
  elements.drop.addEventListener('dragleave', () => elements.drop.classList.remove('dragging'))
  elements.drop.addEventListener('drop', (event) => {
    event.preventDefault()
    elements.drop.classList.remove('dragging')
    loadFile(event.dataTransfer.files[0])
  })
  elements.recognize.addEventListener('click', recognizeGrid)
  elements.solve.addEventListener('click', solveGrid)
  elements.clear.addEventListener('click', () => showGrid(Array(81).fill(0)))
  elements.reset.addEventListener('click', reset)
  elements.selection.querySelector('.frame').addEventListener('pointerdown', startDrag)
  elements.handles.forEach((handle) => handle.addEventListener('pointerdown', startDrag))
  globalThis.addEventListener('pointermove', moveDrag)
  globalThis.addEventListener('pointerup', endDrag)
  globalThis.addEventListener('pointercancel', endDrag)
  loadFixture()
})()
