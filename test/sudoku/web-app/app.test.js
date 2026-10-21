const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const vm = require('node:vm')

const source = readFileSync(join(__dirname, '../../../src/sudoku/web-app/app.js'), 'utf8')

// Die echten Ereignishandler laufen mit kontrolliertem Bildladen und Animationstakt.
// So sind seltene Überschneidungen reproduzierbar; die Fotoerkennung prüfen die separaten Fixture-Tests.
const setup = (sudoku = {}) => {
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
    click: jest.fn(),
    scrollIntoView: jest.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 600 }),
    getContext: () => ({ drawImage: jest.fn(), getImageData: () => ({ width: 600, height: 600, data: [] }) })
  })
  const ids = [
    'file-input',
    'camera-input',
    'camera-button',
    'file-button',
    'drop-zone',
    'crop-stage',
    'photo-frame',
    'photo-canvas',
    'selection',
    'photo-actions',
    'reset-button',
    'empty-state',
    'sudoku-wrap',
    'sudoku-grid',
    'grid-status',
    'solve-button',
    'clear-button',
    'solution-alternatives',
    'solution-list',
    'grid-panel'
  ]
  const elements = Object.fromEntries(ids.map((id) => [id, element()]))
  const frame = element()
  const paths = Object.fromEntries(['.shade', '.guides', '.frame'].map((selector) => [selector, selector === '.frame' ? frame : element()]))
  elements.selection.querySelector = (selector) => paths[selector]
  const images = []
  const frames = []
  const events = {}
  const grid = [5, ...Array(80).fill(0)]
  const corners = [
    { x: 0, y: 0 },
    { x: 600, y: 0 },
    { x: 600, y: 600 },
    { x: 0, y: 600 }
  ]
  const scanner = {
    findGrid: jest.fn(() => ({ corners })),
    warpCorners: jest.fn(() => []),
    snapCorners: jest.fn((pixels, points) => points),
    recognizeDigits: jest.fn(() => ({ grid: grid.slice(), confidence: Array(81).fill(1) }))
  }
  const url = { createObjectURL: jest.fn(() => `blob:${images.length}`), revokeObjectURL: jest.fn() }
  vm.runInNewContext(source, {
    document: {
      querySelector: (selector) => elements[selector.slice(1)],
      querySelectorAll: () => [],
      createElement: element
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
    addEventListener: (name, callback) => {
      events[name] = callback
    },
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
    elements[id].files = [{ type: 'image/jpeg', size: 100 }]
    elements[id].value = 'photo.jpg'
    return elements[id].listeners.change()
  }
  const decode = async (index = images.length - 1) => {
    images[index].onload()
    await flush()
  }
  const values = () => elements['sudoku-grid'].children.map((input) => input.value || '').join('')
  return { elements, images, scanner, url, load, decode, tick, values, events, frame }
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
    expect(app.elements['camera-input'].value).toBe('')
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

describe('Sudoku-App: veraltete Vorgänge', () => {
  test('ein nach Neu starten fertig geladenes Foto bleibt verworfen', async () => {
    const app = setup()
    const pending = app.load()
    app.elements['reset-button'].listeners.click()
    await app.decode()
    await pending

    expect(app.scanner.findGrid).not.toHaveBeenCalled()
    expect(app.elements['grid-status'].textContent).toBe('Noch kein Foto')
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
    expect(app.url.revokeObjectURL).toHaveBeenCalledTimes(2)
    expect(app.elements['file-input'].value).toBe('')
  })

  test.each(['Raster', 'Ziffern'])('Neu starten während der Wartephase für %s verhindert spätere Ergebnisse', async (phase) => {
    const app = setup()
    const pending = app.load()
    await app.decode()
    if (phase === 'Ziffern') await app.tick()
    app.elements['reset-button'].listeners.click()
    await app.tick()
    await pending

    expect(app.scanner.recognizeDigits).not.toHaveBeenCalled()
    expect(app.values()).toBe('')
    expect(app.elements['grid-status'].textContent).toBe('Noch kein Foto')
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
    expect(app.elements['sudoku-wrap'].hidden).toBe(true)
    expect(app.elements['grid-status'].textContent).toBe('Kein Raster gefunden – Ecken setzen')
  })

  test('eine Rahmenkorrektur verwirft die wartende Erkennung und erkennt erst nach dem Loslassen neu', async () => {
    const app = setup()
    const pending = app.load()
    await app.decode()
    await app.tick()
    app.frame.listeners.pointerdown({ target: app.frame, clientX: 100, clientY: 100, preventDefault: jest.fn() })
    await app.tick()
    await pending
    expect(app.scanner.recognizeDigits).not.toHaveBeenCalled()

    app.events.pointermove({ clientX: 90, clientY: 90 })
    app.events.pointerup()
    await app.tick()
    expect(app.scanner.recognizeDigits).toHaveBeenCalledTimes(1)
    expect(app.values()).toBe('5')
  })

  test('der Fehler einer alten Aufnahme überschreibt den aktuellen Status nicht', async () => {
    const app = setup()
    const first = app.load()
    app.elements['reset-button'].listeners.click()
    app.images[0].onerror()
    await first

    expect(app.elements['grid-status'].textContent).toBe('Noch kein Foto')
    expect(app.url.revokeObjectURL).toHaveBeenCalledTimes(1)
  })
})
