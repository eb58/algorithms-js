;(() => {
  'use strict'

  const MAX_FILE_SIZE = 20 * 1024 * 1024
  const MIN_SIDE = 300
  const MAX_PIXELS = 24e6 // größere Fotos werden vor der Erkennung verkleinert
  const DISPLAY_SIZE = 1100
  const PHOTO_MARGIN = 0.04 // Rand um das Sudoku im angezeigten Ausschnitt, relativ zur Rastergröße
  const UNCERTAIN = 0.1 // Mindestabstand zur zweitbesten Ziffer, darunter gilt eine Erkennung als unsicher

  const $ = (selector) => document.querySelector(selector)
  const elements = {
    file: $('#file-input'),
    camera: $('#camera-input'),
    cameraButton: $('#camera-button'),
    fileButton: $('#file-button'),
    drop: $('#drop-zone'),
    cropStage: $('#crop-stage'),
    canvas: $('#photo-canvas'),
    selection: $('#selection'),
    oriented: $('#selection').querySelector('.oriented'),
    photoDigits: $('#selection').querySelector('.photo-digits'),
    reset: $('#reset-button'),
    grid: $('#sudoku-grid'),
    status: $('#grid-status'),
    solve: $('#solve-button'),
    clear: $('#clear-button'),
    alternatives: $('#solution-alternatives'),
    solutionList: $('#solution-list'),
    gridPanel: $('#grid-panel')
  }

  const state = {
    file: null, // Originaldatei des Fotos, solange sie bei einem Erkennungsproblem noch gespeichert werden soll
    image: null, // geladenes Foto, aus dem der Ausschnitt um das Sudoku gezeichnet wird
    pixels: null, // RGBA-Daten des Fotos, auf denen der Scanner arbeitet
    cells: null, // Lage der 81 Zellen im Foto (SudokuScanner.cellTransforms), um ergänzte Zahlen einzutragen
    original: Array(81).fill(0),
    revision: 0 // nur der aktuelle Vorgang darf nach einer Wartephase noch die Oberfläche ändern
  }

  // save: bei Erkennungsproblemen das Foto herunterladen (nicht für Fixtures, die schon im Repository liegen)
  const loadFile = async (file, { save = true } = {}) => {
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
    if (save) state.file = file
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
      state.image = image
      state.pixels = readPixels(image)
      drawPhoto(image)
      elements.drop.hidden = true
      elements.cropStage.hidden = false
      elements.selection.hidden = true
      elements.reset.hidden = false
      setStatus('Raster wird gesucht …', 'neutral')
      await nextFrame()
      if (revision !== state.revision) return

      const found = SudokuScanner.findGrid(state.pixels)
      if (!found) {
        setStatus('Kein Raster gefunden – neues Foto aufnehmen', 'warn')
        saveProblemPhoto()
        return
      }
      renderSelection(found.corners)
      await recognizeGrid(found)
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

  // Das SVG verwendet die Pixelkoordinaten des Fotos als viewBox und skaliert dadurch mit der Anzeige.
  // corners: Ecken des Gitters (oben links, oben rechts, unten rechts, unten links) in Pixeln von state.pixels
  const renderSelection = (corners) => {
    const { width, height } = state.pixels
    const outline = `M${corners.map(({ x, y }) => `${x} ${y}`).join('L')}Z`
    // Blocklinien perspektivisch korrekt: Die fernere Seite des Rasters erscheint im Foto gestaucht.
    const ends = [3, 6].flatMap((line) => [
      { x: line, y: 0 },
      { x: line, y: 9 },
      { x: 0, y: line },
      { x: 9, y: line }
    ])
    const points = SudokuScanner.gridToImage(corners, ends)
    const guides = points.map(({ x, y }, index) => `${index % 2 ? 'L' : 'M'}${x} ${y}`).join('')

    elements.selection.setAttribute('viewBox', `0 0 ${width} ${height}`)
    elements.oriented.removeAttribute('transform')
    elements.selection.querySelector('.shade').setAttribute('d', `M0 0H${width}V${height}H0Z${outline}`)
    elements.selection.querySelector('.guides').setAttribute('d', guides)
    elements.selection.querySelector('.frame').setAttribute('points', corners.map(({ x, y }) => `${x},${y}`).join(' '))
    elements.selection.hidden = false
  }

  // Zeigt nur den Ausschnitt um das Sudoku, um rotation Vierteldrehungen im Uhrzeigersinn gedreht, damit es aufrecht steht.
  // Die Markierung behält ihre Koordinaten in state.pixels; die Gruppe .oriented bildet sie auf den Ausschnitt ab.
  const focusPhoto = (corners, rotation) => {
    const { width, height } = state.pixels
    const xs = corners.map(({ x }) => x)
    const ys = corners.map(({ y }) => y)
    const margin = PHOTO_MARGIN * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
    const left = Math.max(0, Math.min(...xs) - margin)
    const top = Math.max(0, Math.min(...ys) - margin)
    const cropWidth = Math.min(width, Math.max(...xs) + margin) - left
    const cropHeight = Math.min(height, Math.max(...ys) + margin) - top
    const quarter = rotation % 2 === 1
    const [viewWidth, viewHeight] = quarter ? [cropHeight, cropWidth] : [cropWidth, cropHeight]
    const matrix = [
      [1, 0, 0, 1, 0, 0],
      [0, 1, -1, 0, cropHeight, 0],
      [-1, 0, 0, -1, cropWidth, cropHeight],
      [0, -1, 1, 0, 0, cropWidth]
    ][rotation]
    elements.selection.setAttribute('viewBox', `0 0 ${viewWidth} ${viewHeight}`)
    elements.oriented.setAttribute('transform', `matrix(${matrix.join(' ')}) translate(${-left} ${-top})`)

    // state.pixels ist bei sehr großen Fotos verkleinert; der Ausschnitt wird aus dem Originalbild gezeichnet.
    const source = state.image.naturalWidth / width
    const scale = Math.min(1, DISPLAY_SIZE / (Math.max(cropWidth, cropHeight) * source))
    const [drawWidth, drawHeight] = [cropWidth * source * scale, cropHeight * source * scale]
    // Neue Maße setzen auch die Transformation des Kontexts zurück.
    elements.canvas.width = Math.round(quarter ? drawHeight : drawWidth)
    elements.canvas.height = Math.round(quarter ? drawWidth : drawHeight)
    const context = elements.canvas.getContext('2d')
    context.translate(elements.canvas.width / 2, elements.canvas.height / 2)
    context.rotate((rotation * Math.PI) / 2)
    context.drawImage(
      state.image,
      left * source,
      top * source,
      cropWidth * source,
      cropHeight * source,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    )
  }

  // found: Ergebnis von SudokuScanner.findGrid; dessen entzerrtes Raster wird direkt weiterverwendet.
  const recognizeGrid = async ({ corners, board }) => {
    const revision = ++state.revision
    setStatus('Ziffern werden erkannt …', 'neutral')
    await nextFrame()
    if (revision !== state.revision) return
    try {
      const { grid, confidence, rotation } = SudokuScanner.recognizeDigits(board)
      state.cells = SudokuScanner.cellTransforms(corners, rotation)
      focusPhoto(corners, rotation)
      const sanitized = Sudoku.sanitizeRecognition(grid, confidence)
      for (const index of sanitized.removed) confidence[index] = 0
      state.original = sanitized.grid.slice()
      showGrid(sanitized.grid, confidence)
      // Auch mit unsicheren Ziffern wird sofort gelöst; sie werden im Foto markiert. Wurden widersprüchliche
      // Ziffern entfernt, stünde die Lösung über gedruckten Zahlen, deshalb prüft der Nutzer dann zuerst.
      const uncertain = sanitized.grid.flatMap((value, index) => (value && confidence[index] < UNCERTAIN ? [index] : []))
      if (sanitized.removed.length === 0 && !elements.solve.disabled) solveGrid({ auto: true, uncertain })
      else {
        saveProblemPhoto()
        revealResult()
      }
    } catch (error) {
      console.error(error)
      setStatus('Erkennung fehlgeschlagen', 'bad')
      saveProblemPhoto()
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
        hideSolution()
        input.value = input.value.replace(/[^1-9]/g, '').slice(-1)
        input.className = input.value ? 'cell recognized' : 'cell'
        validateInputs()
      })
      input.addEventListener('keydown', (event) => navigateGrid(event, index))
      elements.grid.appendChild(input)
    }
  }

  const showGrid = (values, confidence = Array(81).fill(1), solved = false) => {
    hideSolution()
    const inputs = [...elements.grid.children]
    inputs.forEach((input, index) => {
      const value = values[index]
      input.value = value || ''
      const wasGiven = state.original[index] > 0
      input.className = !value ? 'cell' : solved && !wasGiven ? 'cell solved' : confidence[index] < UNCERTAIN ? 'cell uncertain' : 'cell recognized'
    })
    elements.gridPanel.hidden = false
    validateInputs()
  }

  const hideSolution = () => {
    elements.alternatives.hidden = true
    elements.solutionList.replaceChildren()
    elements.photoDigits.replaceChildren()
  }

  // Trägt Ziffern perspektivisch passend in die Zellen des Fotos ein (0 = Zelle frei lassen) und kreist die Zellen in marked ein.
  // Die Zellmatrix bildet die Einheitszelle ab; Schrift und Lage sind deshalb in Hundertstel einer Zelle angegeben.
  const showPhotoDigits = (values, marked = []) => {
    if (!state.cells) return
    const svg = (name, index) => {
      const [a, b, c, d, e, f] = state.cells[index]
      const node = document.createElementNS('http://www.w3.org/2000/svg', name)
      node.setAttribute('transform', `matrix(${a / 100} ${b / 100} ${c / 100} ${d / 100} ${e} ${f})`)
      return node
    }
    const digits = values.flatMap((value, index) => {
      if (!value) return []
      const text = svg('text', index)
      text.textContent = value
      return [text]
    })
    const rings = marked.map((index) => {
      const ring = svg('circle', index)
      ring.setAttribute('r', 42)
      return ring
    })
    elements.photoDigits.replaceChildren(...digits, ...rings)
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

  // auto: direkt nach der Erkennung; ohne eindeutige Lösung bleibt die App dann beim Prüfen der Zahlen.
  // uncertain: Zellen mit unsicher erkannten Vorgaben, die auch nach dem Lösen markiert bleiben
  const solveGrid = ({ auto = false, uncertain = [] } = {}) => {
    state.revision += 1
    const input = readGrid()
    const solutions = Sudoku.findSolutions(input)
    if (auto && solutions.length !== 1) {
      setStatus(solutions.length ? 'Mehrere Lösungen – Zahlen prüfen' : 'Keine Lösung – Zahlen prüfen', 'warn')
      saveProblemPhoto()
      revealResult()
      return
    }
    if (solutions.length === 0) {
      setStatus('Keine Lösung – Zahlen prüfen', 'bad')
      return
    }
    state.original = input.slice()
    if (solutions.length > 1) {
      showAlternatives(solutions)
      setStatus('Mehrere Lösungen – zwei Möglichkeiten angezeigt', 'warn')
      revealResult()
      return
    }
    const confidence = Array(81).fill(1)
    for (const index of uncertain) confidence[index] = 0
    showGrid(solutions[0], confidence, true)
    showPhotoDigits(
      solutions[0].map((value, index) => (input[index] ? 0 : value)),
      uncertain
    )
    if (uncertain.length) {
      setStatus(`Gelöst – ${uncertain.length} ${uncertain.length === 1 ? 'Ziffer' : 'Ziffern'} unsicher`, 'warn')
      saveProblemPhoto()
    } else setStatus('Gelöst', 'good')
    // Sicher gelöst ist das Foto mit eingetragenen Zahlen das Ergebnis; die Kontrolle wird nur bei Zweifeln gebraucht.
    if (auto && !uncertain.length) elements.gridPanel.hidden = true
    else revealResult()
  }

  // Legt das Originalfoto im Download-Ordner ab, damit sich Erkennungsprobleme später als Fixture nachstellen lassen.
  const saveProblemPhoto = () => {
    const file = state.file
    if (!file) return
    state.file = null // je Foto höchstens einmal
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `sudoku-problem-${file.name || 'foto.jpg'}`
    link.click()
    // Manche Browser lesen die Datei erst nach dem Klick; zu frühes Freigeben bricht den Download ab.
    setTimeout(() => URL.revokeObjectURL(url), 60000)
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

  const setStatus = (text, kind) => {
    elements.status.textContent = text
    elements.status.hidden = !text
    elements.status.className = `status ${kind}`
  }

  const reset = () => {
    state.revision += 1
    state.file = null
    state.image = null
    state.pixels = null
    state.cells = null
    state.original.fill(0)
    elements.file.value = ''
    elements.drop.hidden = false
    elements.cropStage.hidden = true
    elements.reset.hidden = true
    showGrid(Array(81).fill(0))
    elements.gridPanel.hidden = true
    setStatus('', 'neutral')
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
      await loadFile(new File([blob], filename, { type: blob.type }), { save: false })
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
  elements.solve.addEventListener('click', () => solveGrid())
  elements.clear.addEventListener('click', () => {
    state.revision += 1
    showGrid(Array(81).fill(0))
  })
  // Verwirft das aktuelle Foto und öffnet gleich die Auswahl für das nächste, auf Touch-Geräten die Kamera.
  elements.reset.addEventListener('click', () => {
    reset()
    const touch = globalThis.matchMedia?.('(any-pointer: coarse)').matches
    ;(touch ? elements.camera : elements.file).click()
  })
  loadFixture()
})()
