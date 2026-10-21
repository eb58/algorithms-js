// Beliebige Genauigkeit: Festkomma-BigInt mit p Nachkommabits, dazu die Umrechnung in Float-Mantisse und Zweierexponent für die GPU.
;((root, factory) => {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.MandelbrotFixedPoint = api
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const { abs, ceil, floor, log2, max } = Math

  const rescale = (v, from, to) => (to >= from ? v << BigInt(to - from) : v >> BigInt(from - to))
  const bitLen = (v) => (v < 0n ? -v : v).toString(16).length * 4
  const toNum = (v, p) => Number(v >> BigInt(p - 60)) / 2 ** 60

  // v als [Mantisse mit |m| in [1,2), Exponent]; 0 wird zu [0, -1e20]
  const toFE = (v, p) => {
    let n = Number(v >> BigInt(p - 60)),
      e = -60
    if (abs(n) < 2 ** 30 && v) {
      const s = max(0, bitLen(v) - 53)
      n = Number(v >> BigInt(s))
      e = s - p
    }
    if (!n) return [0, -1e20]
    const k = floor(log2(abs(n)))
    return [n / 2 ** k, e + k]
  }

  // Komplexe Zahl x + iy als [Mantisse.x, Mantisse.y, gemeinsamer Exponent]
  const cFE = (x, y, p) => {
    const [mx, ex] = toFE(x, p),
      [my, ey] = toFE(y, p),
      e = max(ex, ey)
    return [mx * 2 ** (ex - e), my * 2 ** (ey - e), e]
  }

  const toDec = (v, p, digits = max(16, ceil((p - 52) * 0.30103))) => {
    const a = v < 0n ? -v : v,
      frac = ((a & ((1n << BigInt(p)) - 1n)) * 10n ** BigInt(digits)) >> BigInt(p)
    return `${v < 0n ? '-' : ''}${a >> BigInt(p)}.${frac.toString().padStart(digits, '0')}`
  }

  const fromDec = (s, p) => {
    const m = String(s)
      .trim()
      .match(/^([+-]?)(\d*)\.?(\d*)$/)
    if (!m) throw 'Ungültige Zahl'
    const v = (BigInt((m[2] || '0') + m[3]) << BigInt(p)) / 10n ** BigInt(m[3].length)
    return m[1] === '-' ? -v : v
  }

  // Referenz-Orbit Z_n für c = x0 + i·y0 bis zur Flucht (|Z|² > 10⁴) oder N, je Eintrag (Mantisse.xy, Exponent, 0)
  const referenceOrbit = (x0, y0, p, N) => {
    const pn = BigInt(p),
      lim = 10000n << pn,
      data = new Float32Array((N + 1) * 4)
    let x = 0n,
      y = 0n,
      n = 0
    for (; n <= N; n++) {
      data.set(cFE(x, y, p), 4 * n)
      const x2 = (x * x) >> pn,
        y2 = (y * y) >> pn
      if (x2 + y2 > lim) {
        n++
        break
      }
      y = ((x * y) >> (pn - 1n)) + y0
      x = x2 - y2 + x0
    }
    return { data: data.subarray(0, 4 * n), len: n }
  }

  return { rescale, bitLen, toNum, toFE, cFE, toDec, fromDec, referenceOrbit }
})
