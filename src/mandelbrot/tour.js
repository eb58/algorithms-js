// Flugbahnen als reine Funktionen der Zeit: dieselbe Rechnung für die Tour in Echtzeit und für die Videoausgabe Bild für Bild.
// Eine Ansicht ist { cx, cy, P, ls, rot, m }: Mittelpunkt als Festkomma mit P Nachkommabits, Zoomstufe, Drehung, Iterationsfaktor.
;((root, factory) => {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./fixed-point'), require('./view'))
  else root.MandelbrotTour = factory(root.MandelbrotFixedPoint, root.MandelbrotView)
})(typeof globalThis !== 'undefined' ? globalThis : this, ({ rescale, toNum, toDec, fromDec }, { precFor, autoIter, ease, wrapAngle }) => {
  const { ceil, hypot, max, min, round } = Math

  const viewOf = ({ re, im, z, r = 0, m = 1 }) => {
    const P = precFor(z)
    return { cx: fromDec(re, P), cy: fromDec(im, P), P, ls: z, rot: r, m }
  }
  // Dezimaldarstellung ohne Genauigkeitsverlust: 2^-P hat genau P Nachkommastellen (toDec kürzt sonst für Anzeige und Link)
  const decimalOf = ({ cx, cy, P, ls, rot, m }) => ({ re: toDec(cx, P, P), im: toDec(cy, P, P), z: ls, r: rot, m })

  // Flug von der Ansicht from zum Ort dest in etwa dur ms: herauszoomen bis homeLs, schwenken, hineinzoomen.
  // Beim Hineinzoomen bleibt der Mittelpunkt exakt auf dem Ziel (tx, ty mit tp Bits), damit eine dort gerechnete
  // Referenzbahn für den ganzen Anflug gilt. at(e) liefert die Ansicht nach e ms und done am Ende.
  const planFlight = (from, dest, { dur, align = true, homeLs }) => {
    const L = max(homeLs, from.ls),
      tp = precFor(dest.z),
      tx = fromDec(dest.re, tp),
      ty = fromDec(dest.im, tp)
    const destRot = align ? (dest.r ?? 0) : 0,
      need = dest.p ? max(1, (6 * dest.p) / autoIter(dest.z)) : (dest.m ?? 1)
    const [sx, sy, ex, ey] = [toNum(from.cx, from.P), toNum(from.cy, from.P), toNum(tx, tp), toNum(ty, tp)]
    const panD = hypot(ex - sx, ey - sy),
      tPan = panD > 1e-3 ? min(2500, 700 + 1500 * panD) : 0
    const wOut = (L - from.ls) * 0.35,
      wIn = L - dest.z,
      rest = max(1000, dur - tPan)
    const tOut = (rest * wOut) / (wOut + wIn || 1)

    const at = (e) => {
      if (e < tOut) {
        const u = ease(e / tOut),
          ls = from.ls + (L - from.ls) * u,
          p = precFor(ls)
        return {
          phase: 'out',
          ls,
          rot: from.rot * (1 - u),
          P: p,
          cx: rescale(from.cx, from.P, p),
          cy: rescale(from.cy, from.P, p),
          m: from.m,
          done: false
        }
      }
      if (e < tOut + tPan) {
        const u = ease((e - tOut) / tPan)
        const [cx, cy] = [sx + (ex - sx) * u, sy + (ey - sy) * u].map((v) => BigInt(round(v * 2 ** 64)))
        return { phase: 'pan', ls: L, rot: 0, P: 64, cx, cy, m: from.m, done: false }
      }
      const u = min(1, (e - tOut - tPan) / (rest - tOut || 1)),
        ls = L + (dest.z - L) * ease(u),
        p = precFor(ls)
      return { phase: 'in', ls, rot: wrapAngle(destRot) * ease(u), P: p, cx: rescale(tx, tp, p), cy: rescale(ty, tp, p), m: need, done: u >= 1 }
    }
    return { duration: tPan + rest, at, target: { cx: tx, cy: ty, P: tp, ls: dest.z, m: need } }
  }

  // Tour als Bildfolge: je Ort ein Flug und hold ms Verweilen. Liefert die Ansicht jedes Frames bei fps Bildern pro Sekunde.
  const tourFrames = (places, { start, fps, fly, hold, align = true, homeLs }) => {
    const frames = []
    let view = start
    for (const place of places) {
      const plan = planFlight(view, place, { dur: fly, align, homeLs })
      const n = ceil((plan.duration * fps) / 1000)
      for (let k = 0; k < n; k++) frames.push({ ...plan.at((k * 1000) / fps), place: place.name })
      view = plan.at(plan.duration)
      for (let k = round((hold * fps) / 1000); k > 0; k--) frames.push({ ...view, phase: 'hold', place: place.name })
    }
    return frames
  }

  return { viewOf, decimalOf, planFlight, tourFrames }
})
