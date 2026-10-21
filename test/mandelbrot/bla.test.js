const { buildBla, NONE } = require('../../src/mandelbrot/bla')
const { fromDec, referenceOrbit } = require('../../src/mandelbrot/fixed-point')
const PLACES = require('../../src/mandelbrot/places')

// Referenzbahn im Seepferdchental; Pixel mit |δc| bis etwa 2^-40 (Bildhöhe etwa wie beim Anflug auf 1e12)
const P = 128
const place = PLACES[2]
const { data: orbit, len } = referenceOrbit(fromDec(place.re, P), fromDec(place.im, P), P, 4000)
const Z = (n) => [orbit[4 * n] * 2 ** orbit[4 * n + 2], orbit[4 * n + 1] * 2 ** orbit[4 * n + 2]]
const log2c = -40

// Exakte Perturbation in Double: δ_{n+1} = 2 Z_n δ_n + δ_n² + δc, ab δ_1 = δc
const exact = (dc, steps) => {
  let [x, y] = dc
  for (let n = 1; n <= steps; n++) {
    const [zx, zy] = Z(n)
    ;[x, y] = [2 * (zx * x - zy * y) + x * x - y * y + dc[0], 2 * (zx * y + zy * x) + 2 * x * y + dc[1]]
  }
  return [x, y]
}
// Knoten (Stufe k, Index j) auf δ anwenden: A δ + B δc
const node = (bla, k, j) => bla.data.subarray(8 * (bla.offset[k] + j), 8 * (bla.offset[k] + j + 1))
const apply = (nd, [dx, dy], [cx, cy]) => {
  const [ax, ay] = [nd[0] * 2 ** nd[2], nd[1] * 2 ** nd[2]],
    [bx, by] = [nd[4] * 2 ** nd[6], nd[5] * 2 ** nd[6]]
  return [ax * dx - ay * dy + bx * cx - by * cy, ax * dy + ay * dx + bx * cy + by * cx]
}
const log2Abs = ([x, y]) => Math.log2(Math.hypot(x, y))

describe('buildBla', () => {
  const bla = buildBla(orbit, len, log2c)

  test('Stufen decken die Bahn ab, ohne über ihr Ende hinauszuspringen', () => {
    expect(len).toBe(4001)
    expect(bla.count[1]).toBe(Math.floor((len - 2) / 2))
    for (let k = 1; k <= bla.levels; k++) {
      expect(bla.count[k]).toBe(Math.floor((len - 2) / 2 ** k))
      expect(1 + bla.count[k] * 2 ** k).toBeLessThanOrEqual(len - 1)
    }
    expect(bla.data.length).toBe(8 * bla.nodes)
  })

  test('Sprünge stimmen innerhalb ihres Radius mit der exakten Iteration überein', () => {
    let used = 0
    for (const dc of [
      [3e-13, -2e-13],
      [-7e-13, 4e-13],
      [5e-13, 6e-13]
    ]) {
      for (let k = 1; k <= bla.levels; k++) {
        const nd = node(bla, k, 0) // Sprung ab m = 1 über 2^k Schritte
        if (log2Abs(dc) >= nd[3]) continue
        used++
        const approx = apply(nd, dc, dc),
          want = exact(dc, 2 ** k)
        expect(Math.hypot(approx[0] - want[0], approx[1] - want[1]) / Math.hypot(...want)).toBeLessThan(1e-4)
      }
    }
    // auch lange Sprünge kommen vor, sonst wäre der Test wertlos
    expect(used).toBeGreaterThan(10)
  })

  test('mitten in der Bahn stimmen Sprünge ebenfalls', () => {
    const dc = [2e-13, 1e-13],
      k = 3,
      j = 5,
      m = 1 + j * 2 ** k
    const start = exact(dc, m - 1)
    const nd = node(bla, k, j)
    expect(log2Abs(start)).toBeLessThan(nd[3])
    const approx = apply(nd, start, dc),
      want = exact(dc, m - 1 + 2 ** k)
    expect(Math.hypot(approx[0] - want[0], approx[1] - want[1]) / Math.hypot(...want)).toBeLessThan(1e-4)
  })

  test('ein größeres Bild (größeres |δc|) verkleinert die Radien', () => {
    const wide = buildBla(orbit, len, -20)
    let smaller = 0
    for (let i = 0; i < bla.nodes; i++) {
      expect(wide.data[8 * i + 3]).toBeLessThanOrEqual(bla.data[8 * i + 3])
      if (wide.data[8 * i + 3] < bla.data[8 * i + 3]) smaller++
    }
    expect(smaller).toBeGreaterThan(0)
  })

  test('kurze Bahnen ergeben eine leere Tabelle', () => {
    const short = buildBla(orbit, 3, log2c)
    expect(short.levels).toBe(0)
    expect(short.nodes).toBe(0)
    expect(short.maxR).toBe(NONE)
  })
})
