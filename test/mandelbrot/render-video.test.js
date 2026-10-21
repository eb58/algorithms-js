const { parseOptions, selectPlaces, variantName, frameFile, sameView, formatTime } = require('../../src/mandelbrot/render-video')
const PLACES = require('../../src/mandelbrot/places')

describe('parseOptions', () => {
  test('Standardwerte', () => {
    const o = parseOptions([])
    expect(o).toMatchObject({ width: 1920, height: 1080, fps: 30, fly: 12000, hold: 3000, ss: 1, align: true, settings: {} })
    expect(o.places).toBe(PLACES)
  })

  test('übernimmt Angaben', () => {
    const o = parseOptions([
      '--size',
      '1280x720',
      '--fps',
      '60',
      '--fly',
      '8.5',
      '--hold',
      '0',
      '--ss',
      '2',
      '--no-align',
      '--settings',
      '{"pal":"Feuer"}'
    ])
    expect(o).toMatchObject({ width: 1280, height: 720, fps: 60, fly: 8500, hold: 0, ss: 2, align: false, settings: { pal: 'Feuer' } })
  })

  test.each([
    [['--size', '1920*1080'], /BREITExHÖHE/],
    [['--size', '1921x1080'], /gerade/],
    [['--fps', '0'], /positive ganze Zahl/],
    [['--fps', '29.97'], /positive ganze Zahl/],
    [['--hold=-1'], /positive Zahl/],
    [['--ss', '8'], /höchstens 4/],
    [['--settings', '{kaputt'], /kein gültiges JSON/],
    [['--settings', '[1]'], /JSON-Objekt/],
    [['--unbekannt'], /Unknown option/]
  ])('weist %j zurück', (args, message) => {
    expect(() => parseOptions(args)).toThrow(message)
  })
})

describe('selectPlaces', () => {
  test('nach Nummer oder Name, Groß- und Kleinschreibung egal', () => {
    expect(selectPlaces('3, nadel').map((p) => p.name)).toEqual(['Seepferdchental', 'Nadel'])
  })

  test('unbekannte Orte werden mit der Liste der verfügbaren gemeldet', () => {
    expect(() => selectPlaces('Atlantis')).toThrow(/Unbekannter Ort „Atlantis“.*1 Goldener Schnitt/)
    expect(() => selectPlaces('99')).toThrow(/Unbekannter Ort/)
  })
})

test('variantName hängt von allen bildwirksamen Optionen ab', () => {
  const base = parseOptions([])
  const name = variantName(base)
  expect(name).toMatch(/^1920x1080_30fps_[0-9a-f]{6}$/)
  expect(variantName(parseOptions([]))).toBe(name)
  expect(variantName(parseOptions(['--settings', '{"pal":"Eis"}']))).not.toBe(name)
  expect(variantName(parseOptions(['--places', '1']))).not.toBe(name)
})

test('Hilfsfunktionen', () => {
  expect(frameFile('d', 0)).toMatch(/frame_00001\.png$/)
  const v = { cx: 1n, cy: 2n, ls: -3, rot: 0, m: 1 }
  expect(sameView(v, { ...v })).toBe(true)
  expect(sameView(v, { ...v, ls: -4 })).toBe(false)
  expect([formatTime(42000), formatTime(125000), formatTime(7380000)]).toEqual(['42 s', '2 min 5 s', '2 h 3 min'])
})
