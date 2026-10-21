const { rescale, toNum, toFE, cFE, toDec, fromDec, referenceOrbit } = require('../../src/mandelbrot/fixed-point')
const { HOME_LS, fitLs, precFor, autoIter, zoom10, fromZoom10, ease, wrapAngle, reprojection } = require('../../src/mandelbrot/view')
const { PALETTES, randomPal, paletteRamp } = require('../../src/mandelbrot/palettes')
const PLACES = require('../../src/mandelbrot/places')

describe('Festkomma', () => {
  test('fromDec und toDec sind zueinander invers', () => {
    expect(toDec(fromDec('-0.75', 64), 64, 4)).toBe('-0.7500')
    expect(toDec(fromDec('1.5', 64), 64)).toBe('1.5000000000000000')
    expect(fromDec(' +2 ', 64)).toBe(2n << 64n)
  })

  test('fromDec weist ungültige Zahlen zurück', () => {
    expect(() => fromDec('1e5', 64)).toThrow('Ungültige Zahl')
    expect(() => fromDec('abc', 64)).toThrow('Ungültige Zahl')
  })

  test('rescale ändert nur die Zahl der Nachkommabits', () => {
    const v = fromDec('-0.75', 64)
    expect(rescale(v, 64, 100)).toBe(fromDec('-0.75', 100))
    expect(rescale(rescale(v, 64, 100), 100, 64)).toBe(v)
    expect(toNum(v, 64)).toBe(-0.75)
  })

  test('toFE normalisiert die Mantisse auf [1,2), auch weit unter Float-Genauigkeit', () => {
    expect(toFE(fromDec('3', 64), 64)).toEqual([1.5, 1])
    expect(toFE(-1n, 300)).toEqual([-1, -300])
    expect(toFE(0n, 64)).toEqual([0, -1e20])
  })

  test('cFE verwendet den größeren Exponenten für beide Komponenten', () => {
    expect(cFE(fromDec('4', 64), fromDec('-0.5', 64), 64)).toEqual([1, -0.125, 2])
  })

  test('referenceOrbit endet nach der Flucht', () => {
    // c = 1: 0, 1, 2, 5, 26, 677 – bei 677 ist |Z|² > 10⁴
    const { data, len } = referenceOrbit(fromDec('1', 64), 0n, 64, 100)
    expect(len).toBe(6)
    expect(data.length).toBe(4 * len)
    expect(data[4 * 5] * 2 ** data[4 * 5 + 2]).toBe(677)
  })

  test('referenceOrbit läuft innerhalb der Menge bis N', () => {
    const { data, len } = referenceOrbit(fromDec('-1', 64), 0n, 64, 10)
    expect(len).toBe(11)
    // c = -1 pendelt zwischen 0 und -1
    expect([...data.subarray(4, 8)]).toEqual([-1, 0, 0, 0])
    expect(data[10]).toBe(Math.fround(-1e20))
  })
})

describe('Ansicht', () => {
  test('zoom10 und fromZoom10 sind zueinander invers', () => {
    expect(zoom10(HOME_LS)).toBe(0)
    expect(fromZoom10(zoom10(-50))).toBeCloseTo(-50, 12)
  })

  test('Genauigkeit und Iterationen wachsen mit der Tiefe', () => {
    expect(precFor(1)).toBe(64)
    expect(precFor(-100.5)).toBe(165)
    expect(autoIter(0)).toBe(300)
    expect(autoIter(-10)).toBe(800)
  })

  test('fitLs passt die Menge auch im Hochformat ein', () => {
    expect(fitLs(9 / 16)).toBe(HOME_LS)
    expect(fitLs(2)).toBeCloseTo(Math.log2(2.9), 12)
  })

  test('ease und wrapAngle', () => {
    ;[0, 0.5, 1].forEach((u) => expect(ease(u)).toBeCloseTo(u, 12))
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(wrapAngle(-0.5)).toBeCloseTo(-0.5, 12)
  })
})

describe('Reprojektion', () => {
  const view = { ls: -3, rot: 0.4 }
  // Bildschirmkoordinate -> Punkt der Ebene relativ zur vorigen Bildmitte
  const toPlane = ([u, v], { ls, rot }, [mx, my] = [0, 0]) => [
    mx + 2 ** ls * (u * Math.cos(rot) - v * Math.sin(rot)),
    my + 2 ** ls * (u * Math.sin(rot) + v * Math.cos(rot))
  ]
  const apply = ({ rot: [a, b], off: [x, y] }, [u, v]) => [a * u - b * v + x, b * u + a * v + y]

  test('ohne Bewegung ist die Abbildung die Identität', () => {
    expect(reprojection([0, 0, -1e20], view, view)).toEqual({ rot: [1, 0], off: [0, 0] })
  })

  test('Zoom, Drehung und Verschiebung treffen dieselben Punkte der Ebene', () => {
    const cur = { ls: -3.7, rot: -1.1 },
      d = [1.25, -0.5, -6]
    const shift = [d[0] * 2 ** d[2], d[1] * 2 ** d[2]]
    for (const uv of [
      [0, 0],
      [1.5, -1],
      [-0.3, 0.8]
    ]) {
      const [x, y] = toPlane(uv, cur, shift)
      const q = apply(reprojection(d, view, cur), uv)
      const [px, py] = toPlane(q, view)
      expect(px).toBeCloseTo(x, 12)
      expect(py).toBeCloseTo(y, 12)
    }
  })
})

describe('Paletten', () => {
  test('paletteRamp durchläuft die Stopps zyklisch', () => {
    const data = paletteRamp(
      [
        [0, 0, 0],
        [200, 100, 50]
      ],
      4
    )
    expect([...data]).toEqual([0, 0, 0, 255, 100, 50, 25, 255, 200, 100, 50, 255, 100, 50, 25, 255])
  })

  test('randomPal liefert sechs HSL-Farben', () => {
    const pal = randomPal(() => 0.5)
    expect(pal).toHaveLength(6)
    expect(pal[0]).toBe('hsl(180,80%,12%)')
  })

  test('alle festen Paletten bestehen aus Hex-Farben', () => {
    Object.entries(PALETTES)
      .filter(([name]) => name !== 'Zufall')
      .forEach(([, stops]) => stops.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/)))
  })
})

describe('Orte', () => {
  test.each(PLACES.map((pl) => [pl.name, pl]))('%s ist gültig', (_, pl) => {
    expect(pl.z).toBeLessThan(0)
    expect(pl.p).toBeGreaterThan(0)
    const p = precFor(pl.z)
    expect(toNum(fromDec(pl.re, p), p)).toBeCloseTo(Number(pl.re), 12)
    expect(toNum(fromDec(pl.im, p), p)).toBeCloseTo(Number(pl.im), 12)
  })
})
