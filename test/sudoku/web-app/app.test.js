const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const vm = require('node:vm')

const source = readFileSync(join(__dirname, '../../../src/sudoku/web-app/app.js'), 'utf8')

// Die echten Ereignishandler laufen mit kontrolliertem Bildladen und Animationstakt.
// So sind seltene Überschneidungen reproduzierbar; die Fotoerkennung prüfen die separaten Fixture-Tests.
const setup = (sudoku = {}, recognized = { grid: [5, ...Array(80).fill(0)], confidence: Array(81).fill(1), rotation: 0 }) => {
  const element = () => ({
    hidden: false,
    value: '',
    style: {},
    dataset: {},
    children: [],
    listeners: {},
    classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() },
    addEventListener(name, handler) {
      this.listeners[name] = handler
    },
    appendChild(child) {
      this.children.push(child)
    },
    replaceChildren(...children) {
      this.children = children
    },
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    click: jest.fn(),
    scrollIntoView: jest.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 600 }),
    getContext: () => ({ drawImage: jest.fn(), translate: jest.fn(), rotate: jest.fn(), getImageData: () => ({ width: 600, height: 600, data: [] }) })
  })
  const ids = [
    'file-input',
    'camera-input',
    'camera-button',
    'file-button',
    'drop-zone',
    'crop-stage',
    'photo-canvas',
    'selection',
    'reset-button',
    'sudoku-grid',
    'grid-status',
    'solve-button',
    'clear-button',
    'solution-alternatives',
    'solution-list',
    'grid-panel'
  ]
  const elements = Object.fromEntries(ids.map((id) => [id, element()]))
  const paths = Object.fromEntries(['.oriented', '.shade', '.guides', '.frame', '.photo-digits'].map((selector) => [selector, element()]))
  elements.selection.querySelector = (selector) => paths[selector]
  const images = []
  const frames = []
  const links = []
  const corners = [
    { x: 0, y: 0 },
    { x: 600, y: 0 },
    { x: 600, y: 600 },
    { x: 0, y: 600 }
  ]
  const scanner = {
    findGrid: jest.fn(() => ({ corners, board: 'entzerrtes Raster' })),
    warpCorners: jest.fn(() => []),
    gridToImage: jest.fn((corners, points) => points),
    cellTransforms: jest.fn(() => Array.from({ length: 81 }, (_, index) => [1, 0, 0, 1, index, index])),
    recognizeDigits: jest.fn(() => ({ grid: recognized.grid.slice(), confidence: recognized.confidence.slice(), rotation: recognized.rotation ?? 0 }))
  }
  const url = { createObjectURL: jest.fn(() => `blob:${images.length}`), revokeObjectURL: jest.fn() }
  vm.runInNewContext(source, {
    document: {
      querySelector: (selector) => elements[selector.slice(1)],
      querySelectorAll: () => [],
      createElement: (name) => {
        const created = element()
        if (name === 'a') links.push(created)
        return created
      },
      createElementNS: (namespace, name) => element()
    },
    Image: class {
      constructor() {
        this.naturalWidth = 600
        this.naturalHeight = 600
        images.push(this)
      }
    },
    URL: url,
    URLSearchParams,
    location: { search: '' },
    requestAnimationFrame: (callback) => frames.push(callback),
    setTimeout: (callback) => callback(),
    SudokuScanner: scanner,
    Sudoku: { sanitizeRecognition: (value) => ({ grid: value, removed: [] }), validate: () => true, ...sudoku },
    console: { error: jest.fn() }
  })
  const flush = async () => {
    await Promise.resolve()
    await Promise.resolve()
  }
  const tick = async () => {
    frames.shift()()
    await flush()
  }
  const load = (id = 'file-input') => {
    elements[id].files = [{ name: 'photo.jpg', type: 'image/jpeg', size: 100 }]
    elements[id].value = 'photo.jpg'
    return elements[id].listeners.change()
  }
  const decode = async (index = images.length - 1) => {
    images[index].onload()
    await flush()
  }
  const values = () => elements['sudoku-grid'].children.map((input) => input.value || '').join('')
  const scan = async () => {
    const pending = load()
    await decode()
    await tick()
    await tick()
    await pending
  }
  return { elements, paths, images, links, scanner, url, load, decode, tick, scan, values }
}

describe('Sudoku-App: Fotoauswahl', () => {
  test('die Schaltflächen öffnen die jeweils zugehörige Eingabe', () => {
    const app = setup()
    app.elements['camera-button'].listeners.click()
    expect(app.elements['camera-input'].click).toHaveBeenCalledTimes(1)
    expect(app.elements['file-input'].click).not.toHaveBeenCalled()
    app.elements['file-button'].listeners.click()
    expect(app.elements['file-input'].click).toHaveBeenCalledTimes(1)
  })

  test('eine Kameraaufnahme durchläuft die Fotoerkennung', async () => {
    const app = setup()
    const pending = app.load('camera-input')
    await app.decode()
    await app.tick()
    await app.tick()
    await pending
    expect(app.values()).toBe('5')
    expect(app.elements.selection.hidden).toBe(false)
    expect(app.elements['camera-input'].value).toBe('')
  })

  test('die Ziffernerkennung verwendet das bei der Rastersuche entzerrte Raster', async () => {
    const app = setup()
    await app.scan()
    expect(app.scanner.recognizeDigits).toHaveBeenCalledWith('entzerrtes Raster')
    expect(app.scanner.warpCorners).not.toHaveBeenCalled()
  })

  test.each(['file-input', 'camera-input'])('Abbrechen von %s erhält den Status', (id) => {
    const app = setup()
    app.elements['grid-status'].textContent = 'Noch kein Foto'
    app.elements['file-input'].files = []
    app.elements['camera-input'].files = []
    app.elements[id].listeners.change()
    expect(app.elements['grid-status'].textContent).toBe('Noch kein Foto')
    expect(app.images).toHaveLength(0)
  })
})

describe('Sudoku-App: Lösungen', () => {
  test('zeigt bei Mehrdeutigkeit die ersten beiden Lösungen', () => {
    const first = Array.from({ length: 81 }, (_, index) => (index % 9) + 1)
    const second = first.slice().reverse()
    const app = setup({ findSolutions: () => [first, second] })
    app.elements['sudoku-grid'].children.forEach((input, index) => {
      input.value = index < 17 ? (index % 9) + 1 : ''
    })

    app.elements['solve-button'].listeners.click()

    expect(app.elements['solution-alternatives'].hidden).toBe(false)
    expect(app.elements['solution-list'].children).toHaveLength(2)
    expect(app.elements['solution-list'].children[0].children[1].children).toHaveLength(81)
    expect(app.elements['grid-status'].textContent).toBe('Mehrere Lösungen – zwei Möglichkeiten angezeigt')

    const input = app.elements['sudoku-grid'].children[20]
    input.value = '3'
    input.listeners.input()
    expect(app.elements['solution-alternatives'].hidden).toBe(true)
  })
})

describe('Sudoku-App: sofort lösen', () => {
  const givens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 1, 2, 3]
  const recognized = (confidence = Array(81).fill(1)) => ({ grid: [...givens, ...Array(63).fill(0)], confidence })
  const solution = [...givens, ...Array(63).fill(9)]
  const photoDigits = (app) => app.paths['.photo-digits'].children

  test('eine zweifelsfreie Erkennung wird gelöst und die ergänzten Zahlen stehen im Foto', async () => {
    const app = setup({ findSolutions: () => [solution] }, recognized())
    await app.scan()

    expect(app.elements['grid-status'].textContent).toBe('Gelöst')
    expect(app.elements['grid-panel'].hidden).toBe(true)
    expect(photoDigits(app)).toHaveLength(63)
    expect(photoDigits(app)[0].textContent).toBe(9)
    expect(photoDigits(app)[0].setAttribute).toHaveBeenCalledWith('transform', 'matrix(0.01 0 0 0.01 18 18)')

    const input = app.elements['sudoku-grid'].children[20]
    input.value = '3'
    input.listeners.input()
    expect(photoDigits(app)).toHaveLength(0)
  })

  test('ein gedrehtes Foto wird mit seiner Markierung aufgerichtet', async () => {
    const app = setup({ findSolutions: () => [solution] }, { ...recognized(), rotation: 1 })
    await app.scan()

    expect(app.scanner.cellTransforms).toHaveBeenCalledWith(expect.anything(), 1)
    expect(app.paths['.oriented'].setAttribute).toHaveBeenCalledWith('transform', 'matrix(0 1 -1 0 600 0) translate(0 0)')
    expect(app.elements.selection.setAttribute).toHaveBeenLastCalledWith('viewBox', '0 0 600 600')
  })

  test('unsichere Ziffern werden mitgelöst, im Foto markiert und bleiben zur Kontrolle offen', async () => {
    const app = setup({ findSolutions: () => [solution] }, recognized([0.05, 1, 0.02, ...Array(78).fill(1)]))
    await app.scan()

    expect(app.elements['grid-status'].textContent).toBe('Gelöst – 2 Ziffern unsicher')
    expect(app.elements['grid-status'].className).toBe('status warn')
    expect(app.elements['grid-panel'].hidden).toBe(false)
    expect(photoDigits(app)).toHaveLength(65)
    const rings = photoDigits(app).slice(63)
    expect(rings.map((ring) => ring.setAttribute.mock.calls)).toEqual([
      [
        ['transform', 'matrix(0.01 0 0 0.01 0 0)'],
        ['r', 42]
      ],
      [
        ['transform', 'matrix(0.01 0 0 0.01 2 2)'],
        ['r', 42]
      ]
    ])
    const cells = app.elements['sudoku-grid'].children
    expect([cells[0].className, cells[1].className, cells[2].className, cells[20].className]).toEqual([
      'cell uncertain',
      'cell recognized',
      'cell uncertain',
      'cell solved'
    ])
  })

  test('eine Ziffer, die einer anderen widerspricht, verhindert das sofortige Lösen', async () => {
    const findSolutions = jest.fn(() => [solution])
    const app = setup({ findSolutions, sanitizeRecognition: (grid) => ({ grid: [0, ...grid.slice(1)], removed: [0] }) }, recognized())
    await app.scan()

    expect(findSolutions).not.toHaveBeenCalled()
    expect(app.elements['grid-panel'].hidden).toBe(false)
    expect(photoDigits(app)).toHaveLength(0)
  })

  test('ohne eindeutige Lösung bleibt die App beim Prüfen', async () => {
    const app = setup({ findSolutions: () => [solution, solution] }, recognized())
    await app.scan()

    expect(app.elements['grid-status'].textContent).toBe('Mehrere Lösungen – Zahlen prüfen')
    expect(app.elements['solution-alternatives'].hidden).toBe(true)
    expect(photoDigits(app)).toHaveLength(0)
  })
})

describe('Sudoku-App: Fotos mit Erkennungsproblemen', () => {
  const givens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 1, 2, 3]
  const recognized = (confidence = Array(81).fill(1)) => ({ grid: [...givens, ...Array(63).fill(0)], confidence })
  const solution = [...givens, ...Array(63).fill(9)]
  const downloads = (app) => app.links.filter((link) => link.click.mock.calls.length).map((link) => link.download)

  test('ein sofort gelöstes Foto wird nicht gespeichert', async () => {
    const app = setup({ findSolutions: () => [solution] }, recognized())
    await app.scan()
    expect(downloads(app)).toEqual([])
  })

  test.each([
    ['einer unsicheren Ziffer', { findSolutions: () => [solution] }, recognized([0.05, ...Array(80).fill(1)])],
    ['mehreren Lösungen', { findSolutions: () => [solution, solution] }, recognized()],
    ['zu wenigen Zahlen', { findSolutions: () => [] }, undefined]
  ])('bei %s landet das Foto einmal im Download-Ordner', async (_, sudoku, digits) => {
    const app = setup(sudoku, digits)
    await app.scan()
    expect(downloads(app)).toEqual(['sudoku-problem-photo.jpg'])
    expect(app.url.revokeObjectURL).toHaveBeenCalledWith(app.links[0].href)

    app.elements['solve-button'].listeners.click()
    expect(downloads(app)).toHaveLength(1)
  })

  test('ein Foto ohne Raster wird gespeichert', async () => {
    const app = setup()
    app.scanner.findGrid.mockReturnValue(null)
    const pending = app.load()
    await app.decode()
    await app.tick()
    await pending
    expect(downloads(app)).toEqual(['sudoku-problem-photo.jpg'])
  })
})

describe('Sudoku-App: veraltete Vorgänge', () => {
  test('ein nach „Nächstes Foto“ fertig geladenes Foto bleibt verworfen', async () => {
    const app = setup()
    const pending = app.load()
    app.elements['reset-button'].listeners.click()
    expect(app.elements['file-input'].click).toHaveBeenCalledTimes(1)
    await app.decode()
    await pending

    expect(app.scanner.findGrid).not.toHaveBeenCalled()
    expect(app.elements['grid-status'].textContent).toBe('')
    expect(app.elements['grid-status'].hidden).toBe(true)
    expect(app.elements['crop-stage'].hidden).toBe(true)
    expect(app.url.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  test('die zuletzt gewählte Aufnahme gewinnt bei vertauschter Ladereihenfolge', async () => {
    const app = setup()
    const first = app.load()
    const second = app.load()
    await app.decode(1)
    await app.tick()
    await app.tick()
    await second
    await app.decode(0)
    await first

    expect(app.scanner.findGrid).toHaveBeenCalledTimes(1)
    expect(app.values()).toBe('5')
    expect(app.url.revokeObjectURL).toHaveBeenCalledWith('blob:0')
    expect(app.url.revokeObjectURL).toHaveBeenCalledWith('blob:1')
    expect(app.elements['file-input'].value).toBe('')
  })

  test.each(['Raster', 'Ziffern'])('„Nächstes Foto“ während der Wartephase für %s verhindert spätere Ergebnisse', async (phase) => {
    const app = setup()
    const pending = app.load()
    await app.decode()
    if (phase === 'Ziffern') await app.tick()
    app.elements['reset-button'].listeners.click()
    await app.tick()
    await pending

    expect(app.scanner.recognizeDigits).not.toHaveBeenCalled()
    expect(app.values()).toBe('')
    expect(app.elements['grid-status'].textContent).toBe('')
    expect(app.elements['grid-status'].hidden).toBe(true)
  })

  test.each(['Leeren', 'Eingabe'])('%s wird nicht von einer wartenden Erkennung überschrieben', async (action) => {
    const app = setup()
    const pending = app.load()
    await app.decode()
    await app.tick()
    if (action === 'Leeren') app.elements['clear-button'].listeners.click()
    else {
      const input = app.elements['sudoku-grid'].children[0]
      input.value = '7'
      input.listeners.input()
    }
    await app.tick()
    await pending

    expect(app.scanner.recognizeDigits).not.toHaveBeenCalled()
    expect(app.values()).toBe(action === 'Leeren' ? '' : '7')
  })

  test('ein neues Foto ohne Raster zeigt keine Zahlen des vorherigen Fotos', async () => {
    const app = setup()
    const first = app.load()
    await app.decode()
    await app.tick()
    await app.tick()
    await first
    expect(app.values()).toBe('5')

    app.scanner.findGrid.mockReturnValue(null)
    const second = app.load()
    await app.decode()
    await app.tick()
    await second

    expect(app.values()).toBe('')
    expect(app.elements['grid-panel'].hidden).toBe(true)
    expect(app.elements.selection.hidden).toBe(true)
    expect(app.elements['grid-status'].textContent).toBe('Kein Raster gefunden – neues Foto aufnehmen')
  })

  test('der Fehler einer alten Aufnahme überschreibt den aktuellen Status nicht', async () => {
    const app = setup()
    const first = app.load()
    app.elements['reset-button'].listeners.click()
    app.images[0].onerror()
    await first

    expect(app.elements['grid-status'].textContent).toBe('')
    expect(app.elements['grid-status'].hidden).toBe(true)
    expect(app.url.revokeObjectURL).toHaveBeenCalledTimes(1)
  })
})
