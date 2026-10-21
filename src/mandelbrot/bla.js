// Bilineare Approximation (BLA, nach Zhuoran) der Perturbationsrechnung δ' = 2 Z_m δ + δ² + δc: Solange |δ| klein gegen |Z_m|
// ist, gilt δ_{m+l} ≈ A δ_m + B δc. Die Tabelle fasst 2, 4, 8, … aufeinanderfolgende Schritte zu einem Sprung zusammen, mit dem
// ein Pixel Tausende Iterationen auf einmal überspringt. Zahlen als (Mantisse.x, Mantisse.y, Exponent) wie im Shader, weil A
// über viele Schritte weit außerhalb des Float- und Double-Bereichs liegen kann.
;((root, factory) => {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.MandelbrotBla = api
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const { abs, floor, hypot, log2, max, min } = Math
  const NONE = -1e30 // log2 eines ungültigen Radius bzw. Exponent der Null, endlich für Float32
  const EPS = 2 ** -24 // zulässiger relativer Fehler je Schritt, etwa Float-Genauigkeit

  // Komplexe Zahl x·2^e normieren, sodass max(|x|, |y|) in [1, 2) liegt
  const norm = (x, y, e, out, i) => {
    const a = max(abs(x), abs(y))
    if (a === 0 || !Number.isFinite(a)) {
      out[i] = out[i + 1] = 0
      out[i + 2] = NONE
      return
    }
    const k = floor(log2(a))
    const s = 2 ** -k
    out[i] = x * s
    out[i + 1] = y * s
    out[i + 2] = e + k
  }
  const log2Abs = (v, i) => (v[i] === 0 && v[i + 1] === 0 ? NONE : v[i + 2] + log2(hypot(v[i], v[i + 1])))
  // log2(2^a - 2^b) für a > b
  const log2Diff = (a, b) => (b >= a ? NONE : a + log2(1 - 2 ** (b - a)))

  // Eine Stufe: je Knoten A (3 Werte), B (3 Werte) und log2 des Gültigkeitsradius
  const level = (n) => ({ n, a: new Float64Array(3 * n), b: new Float64Array(3 * n), r: new Float64Array(n) })

  // Knoten x (zuerst) und y (danach) zu einem Sprung verbinden. Gültig, solange auch der Zwischenwert A_x δ + B_x δc im
  // Radius von y bleibt: |δ| < (r_y − |B_x|·|δc|) / |A_x|, mit |δc| ≤ 2^log2c für alle Pixel des Bildes.
  const merge = (src, x, y, dst, k, log2c, tmp) => {
    const [ax, ay, ae] = [src.a[3 * x], src.a[3 * x + 1], src.a[3 * x + 2]]
    const [bx, by, be] = [src.b[3 * x], src.b[3 * x + 1], src.b[3 * x + 2]]
    const [cx, cy, ce] = [src.a[3 * y], src.a[3 * y + 1], src.a[3 * y + 2]]
    // A = A_y A_x
    norm(cx * ax - cy * ay, cx * ay + cy * ax, ce + ae, dst.a, 3 * k)
    // B = A_y B_x + B_y
    norm(cx * bx - cy * by, cx * by + cy * bx, ce + be, tmp, 0)
    const E = max(tmp[2], src.b[3 * y + 2])
    const [s1, s2] = [2 ** (tmp[2] - E), 2 ** (src.b[3 * y + 2] - E)]
    norm(tmp[0] * s1 + src.b[3 * y] * s2, tmp[1] * s1 + src.b[3 * y + 1] * s2, E, dst.b, 3 * k)
    const ry = log2Diff(src.r[y], log2Abs(src.b, 3 * x) + log2c)
    dst.r[k] = min(src.r[x], ry === NONE ? NONE : ry - log2Abs(src.a, 3 * x))
  }

  // Tabelle zur Referenzbahn (orbit: je Eintrag Mantisse.xy, Exponent, 0 wie referenceOrbit; len Einträge) für Bilder mit
  // |δc| ≤ 2^log2c. Stufe k enthält Sprünge der Länge 2^k ab m = 1 + j·2^k, die bei höchstens len − 1 enden.
  // Ergebnis: data mit 8 Werten je Knoten (A.xy, A.e, log2 r, B.xy, B.e, 0), offset/count je Stufe ab 1, maxR = größter Radius.
  const buildBla = (orbit, len, log2c, eps = EPS) => {
    let cur = level(max(0, len - 2))
    const le = log2(eps)
    for (let j = 0; j < cur.n; j++) {
      const m = j + 1,
        [zx, zy, ze] = [orbit[4 * m], orbit[4 * m + 1], orbit[4 * m + 2]]
      // Einzelschritt: A = 2 Z_m, B = 1, gültig solange |δ|² ≤ ε |2 Z_m δ|
      norm(zx, zy, ze + 1, cur.a, 3 * j)
      cur.b.set([1, 0, 0], 3 * j)
      cur.r[j] = zx === 0 && zy === 0 ? NONE : le + log2Abs(cur.a, 3 * j)
    }
    const levels = [],
      tmp = new Float64Array(3)
    while (cur.n >= 2) {
      const next = level(floor(cur.n / 2))
      for (let k = 0; k < next.n; k++) merge(cur, 2 * k, 2 * k + 1, next, k, log2c, tmp)
      levels.push(next)
      cur = next
    }
    const offset = [0],
      count = [0]
    let total = 0
    for (const lv of levels) {
      offset.push(total)
      count.push(lv.n)
      total += lv.n
    }
    const data = new Float32Array(8 * total)
    let maxR = NONE
    levels.forEach((lv, l) => {
      for (let k = 0; k < lv.n; k++) {
        const o = 8 * (offset[l + 1] + k)
        data.set([lv.a[3 * k], lv.a[3 * k + 1], lv.a[3 * k + 2], lv.r[k], lv.b[3 * k], lv.b[3 * k + 1], lv.b[3 * k + 2], 0], o)
        maxR = max(maxR, lv.r[k])
      }
    })
    return { data, offset, count, levels: levels.length, nodes: total, maxR, log2c }
  }

  return { NONE, EPS, buildBla }
})
