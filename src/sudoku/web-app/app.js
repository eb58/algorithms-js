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
    camera: $('#camera-input'),
    cameraButton: $('#camera-button'),
    fileButton: $('#file-button'),
    drop: $('#drop-zone'),
    cropStage: $('#crop-stage'),
    frame: $('#photo-frame'),
    canvas: $('#photo-canvas'),
    selection: $('#selection'),
    handles: [...document.querySelectorAll('.handle')],
    photoActions: $('#photo-actions'),
    reset: $('#reset-button'),
    empty: $('#empty-state'),
    sudokuWrap: $('#sudoku-wrap'),
    grid: $('#sudoku-grid'),
    status: $('#grid-status'),
    solve: $('#solve-button'),
    clear: $('#clear-button'),
    alternatives: $('#solution-alternatives'),
    solutionList: $('#solution-list'),
    gridPanel: $('#grid-panel')
  }

  const state = {
    pixels: null, // RGBA-Daten des Fotos, auf denen der Scanner arbeitet
    corners: null, // Ecken des Gitters (oben links, oben rechts, unten rechts, unten links) in Pixeln von state.pixels
    original: Array(81).fill(0),
    drag: null,
    revision: 0 // nur der aktuelle Vorgang darf nach einer Wartephase noch die Oberfläche ändern
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

    reset()
    const revision = state.revision
    elements.reset.hidden = false
    setStatus('Foto wird geladen …', 'neutral')
    const url = URL.createObjectURL(file)
    try {
      const image = await loadImage(url)
      if (revision !== state.revision) return
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
      if (revision !== state.revision) return

      // Wird ein Raster gefunden, stehen die Zahlen sofort im erkannten Sudoku; sonst setzt der Nutzer die Ecken.
      const found = SudokuScanner.findGrid(state.pixels)
      state.corners = found ? found.corners : defaultCorners()
      renderSelection()
      if (found) await recognizeGrid({ reveal: true })
      else setStatus('Kein Raster gefunden – Ecken setzen', 'warn')
    } catch (error) {
      if (revision !== state.revision) return
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
    state.revision += 1
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

  // Nach dem Loslassen rastet der Rahmen auf ein nahe gelegenes Gitter ein, und die Zahlen werden neu erkannt.
  const endDrag = () => {
    if (!state.drag) return
    state.drag = null
    try {
      state.corners = SudokuScanner.snapCorners(state.pixels, state.corners)
      renderSelection()
      recognizeGrid()
    } catch (error) {
      console.error(error)
    }
  }

  const recognizeGrid = async ({ reveal = false } = {}) => {
    if (!state.pixels || !state.corners) return
    const revision = ++state.revision
    const pixels = state.pixels
    const corners = state.corners.map((point) => ({ ...point }))
    setStatus('Ziffern werden erkannt …', 'neutral')
    await nextFrame()
    if (revision !== state.revision) return
    try {
      const { grid, confidence } = SudokuScanner.recognizeDigits(SudokuScanner.warpCorners(pixels, corners))
      const sanitized = Sudoku.sanitizeRecognition(grid, confidence)
      for (const index of sanitized.removed) confidence[index] = 0
      state.original = sanitized.grid.slice()
      setStep(2)
      showGrid(sanitized.grid, confidence)
      if (reveal) revealResult()
    } catch (error) {
      console.error(error)
      setStatus('Erkennung fehlgeschlagen', 'bad')
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
        state.revision += 1
        hideAlternatives()
        input.value = input.value.replace(/[^1-9]/g, '').slice(-1)
        input.className = input.value ? 'cell recognized' : 'cell'
        validateInputs()
      })
      input.addEventListener('keydown', (event) => navigateGrid(event, index))
      elements.grid.appendChild(input)
    }
  }

  const showGrid = (values, confidence = Array(81).fill(1), solved = false) => {
    hideAlternatives()
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

  const hideAlternatives = () => {
    elements.alternatives.hidden = true
    elements.solutionList.replaceChildren()
  }

  const showAlternatives = (solutions) => {
    const options = solutions.map((solution, optionIndex) => {
      const option = document.createElement('section')
      option.className = 'solution-option'
      const heading = document.createElement('h4')
      heading.textContent = `Lösung ${optionIndex + 1}`
      const grid = document.createElement('div')
      grid.className = 'sudoku-grid'
      grid.setAttribute('aria-label', heading.textContent)
      solution.forEach((value, index) => {
        const cell = document.createElement('span')
        cell.className = state.original[index] ? 'cell solution-cell recognized' : 'cell solution-cell solved'
        cell.textContent = value
        grid.appendChild(cell)
      })
      option.appendChild(heading)
      option.appendChild(grid)
      return option
    })
    elements.solutionList.replaceChildren(...options)
    elements.alternatives.hidden = false
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
    state.revision += 1
    const input = readGrid()
    const solutions = Sudoku.findSolutions(input)
    if (solutions.length === 0) {
      setStatus('Keine Lösung – Zahlen prüfen', 'bad')
      return
    }
    state.original = input.slice()
    if (solutions.length > 1) {
      showAlternatives(solutions)
      setStatus('Mehrere Lösungen – zwei Möglichkeiten angezeigt', 'warn')
      setStep(3)
      revealResult()
      return
    }
    showGrid(solutions[0], Array(81).fill(1), true)
    setStatus('Gelöst', 'good')
    setStep(3)
    revealResult()
  }

  // Bei einspaltigem Layout liegt das Ergebnis unter dem Foto und wäre sonst nicht zu sehen.
  const revealResult = () => {
    if (globalThis.matchMedia?.('(max-width: 850px)').matches) elements.gridPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    state.revision += 1
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

    const revision = state.revision
    try {
      const response = await fetch(`./fixtures/${encodeURIComponent(filename)}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      if (revision !== state.revision) return
      await loadFile(new File([blob], filename, { type: blob.type }))
    } catch (error) {
      if (revision !== state.revision) return
      console.error(error)
      setStatus('Fixture konnte nicht geladen werden', 'bad')
    }
  }

  buildGrid()

  elements.cameraButton.addEventListener('click', () => elements.camera.click())
  elements.fileButton.addEventListener('click', () => elements.file.click())
  ;[elements.file, elements.camera].forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files[0]
      input.value = '' // dieselbe Datei darf nach einem Fehlversuch erneut gewählt werden
      if (file) return loadFile(file)
    })
  })
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
  elements.solve.addEventListener('click', solveGrid)
  elements.clear.addEventListener('click', () => {
    state.revision += 1
    showGrid(Array(81).fill(0))
  })
  elements.reset.addEventListener('click', reset)
  elements.selection.querySelector('.frame').addEventListener('pointerdown', startDrag)
  elements.handles.forEach((handle) => handle.addEventListener('pointerdown', startDrag))
  globalThis.addEventListener('pointermove', moveDrag)
  globalThis.addEventListener('pointerup', endDrag)
  globalThis.addEventListener('pointercancel', endDrag)
  loadFixture()
})()
