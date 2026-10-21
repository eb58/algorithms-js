// Ansicht: ls = log2 der halben Bildhöhe in der komplexen Ebene, Vergrößerung 1 entspricht ls = HOME_LS.
;((root, factory) => {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.MandelbrotView = api
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const { atan2, ceil, cos, log2, log10, max, PI, sin } = Math
  const HOME_LS = 1.25
  const LOG10_2 = log10(2)

  // Übersicht so, dass die ganze Menge auch im Hochformat (aspect = Höhe / Breite) in die Breite passt
  const fitLs = (aspect) => max(HOME_LS, log2(1.45 * aspect))
  // Nachkommabits, damit Pixelabstände bei Zoomstufe l exakt bleiben
  const precFor = (l) => max(64, ceil(-l) + 64)
  const autoIter = (l) => 300 + 50 * max(0, -l)
  const zoom10 = (l) => (HOME_LS - l) * LOG10_2
  const fromZoom10 = (z) => HOME_LS - z / LOG10_2
  const ease = (u) => u - sin(2 * PI * u) / (2 * PI)
  const wrapAngle = (a) => atan2(sin(a), cos(a))

  // Bildschirmkoordinaten (halbe Bildhöhe = 1) des aktuellen Bildes -> des vorigen: q = rot * uv + off als komplexe Zahlen.
  // d = Verschiebung der Mitte gegenüber dem vorigen Bild als [Mantisse.x, Mantisse.y, Exponent], prev/cur = { ls, rot }.
  const reprojection = (d, prev, cur) => {
    const s = 2 ** (cur.ls - prev.ls),
      a = cur.rot - prev.rot,
      k = 2 ** (d[2] - prev.ls),
      [x, y] = [d[0] * k, d[1] * k],
      [c, sn] = [cos(prev.rot), sin(prev.rot)]
    return { rot: [s * cos(a), s * sin(a)], off: [x * c + y * sn, y * c - x * sn] }
  }

  return { HOME_LS, fitLs, precFor, autoIter, zoom10, fromZoom10, ease, wrapAngle, reprojection }
})
