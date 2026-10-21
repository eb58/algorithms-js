// Mandelbrot Deep Zoom: Zustand, Render-Schleife, Flüge & Tour sowie die Bedienung über Panel, Maus, Touch und Tastatur.
const { rescale, toNum, cFE, toDec, fromDec, referenceOrbit } = MandelbrotFixedPoint
const { fitLs, precFor, autoIter, zoom10: zoomOf, fromZoom10, ease, wrapAngle, reprojection, maxPreviewScale, maxStripRows } = MandelbrotView
const { PALETTES, randomPal, paletteRamp } = MandelbrotPalettes
const PLACES = MandelbrotPlaces

const $ = (s) => document.querySelector(s)
const canvas = $('#c')
const fail = (msg) => {
  $('#err').style.display = 'grid'
  $('#err').textContent = msg
  throw msg
}
let renderer
try {
  renderer = createMandelbrotRenderer(canvas, MandelbrotShaders, () => {
    ref = null
    cw = ch = 0
    uploadPal()
  })
} catch (e) {
  fail(e.message)
}

// --- Einstellungen (in localStorage) ---
const DEF = {
  pal: 'Klassisch',
  map: 1,
  dens: 1,
  phase: 0,
  cycle: 0,
  inside: '#000000',
  angle: 0,
  relief: 0.45,
  height: 1,
  light: 45,
  gloss: 0.25,
  iter: 1,
  res: 1,
  quality: 1,
  fly: 12,
  hold: 3,
  loop: true,
  shuffle: false,
  align: true,
  mine: [],
  custom: null
}
const KEY = 'mandel-deepzoom',
  KEY_PLACES = 'mandel-deepzoom-orte'
const load = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k))
  } catch {
    return null
  }
}
const store = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {}
}
const S = { ...DEF, ...load(KEY) }
const save = () => store(KEY, { ...S, mine: undefined })
// Orte getrennt und vor jeder Änderung frisch lesen: sonst überschreibt ein zweiter Tab sie mit seinem veralteten Stand
const loadMine = () => load(KEY_PLACES) ?? S.mine ?? []
const updateMine = (f) => {
  S.mine = f(loadMine())
  store(KEY_PLACES, S.mine)
  renderPlaces()
}
S.mine = loadMine()
store(KEY_PLACES, S.mine)
addEventListener('storage', (e) => e.key === KEY_PLACES && ((S.mine = loadMine()), renderPlaces()))

const rgb = (c) => {
  const x = document.createElement('canvas').getContext('2d')
  x.fillStyle = c
  x.fillRect(0, 0, 1, 1)
  return [...x.getImageData(0, 0, 1, 1).data.slice(0, 3)]
}
const stops = (name) => (name === 'Zufall' ? (S.custom ??= randomPal()) : (PALETTES[name] ?? PALETTES.Klassisch))
const uploadPal = () => {
  renderer.setPalette(paletteRamp(stops(S.pal).map(rgb)))
  needShow = true
}

// --- Ansicht: ls = log2 der halben Bildhöhe, rot = Drehung, Mittelpunkt (cx, cy) mit P Nachkommabits ---
const fitZ = () => fitLs(innerHeight / innerWidth)
const HOME = {
  re: '-0.75',
  im: '0',
  r: 0,
  get z() {
    return fitZ()
  }
}
let P = 64,
  cx = 0n,
  cy = 0n,
  ls = 1.25,
  rot = 0,
  placeMul = 1,
  ref = null
const updPrec = () => {
  const p = precFor(ls)
  ;[cx, cy, P] = [rescale(cx, P, p), rescale(cy, P, p), p]
}
const maxIter = (l = ls) => Math.min(2e6, Math.round(autoIter(l) * S.iter * placeMul))
const setView = ({ re, im, z, r = 0 }) => {
  ls = z
  rot = r
  P = precFor(z)
  cx = fromDec(re, P)
  cy = fromDec(im, P)
  dirty = true
}
const move = (ux, uy) => {
  const k = 2 ** (ls + P),
    c = Math.cos(rot),
    s = Math.sin(rot)
  cx += BigInt(Math.round((ux * c - uy * s) * k))
  cy += BigInt(Math.round((ux * s + uy * c) * k))
  dirty = true
}
const zoomAt = ([ux, uy], dls) => {
  const f = 1 - 2 ** dls
  move(ux * f, uy * f)
  ls += dls
  updPrec()
}
const offset = () => cFE(cx - rescale(ref.x, ref.p, P), cy - rescale(ref.y, ref.p, P), P)

const computeRef = (N) => {
  const { data, len } = referenceOrbit(cx, cy, P, N)
  renderer.setOrbit(data, len)
  ref = { x: cx, y: cy, p: P, len, N }
  refStall = 2
}

// --- Render-Steuerung ---
let dirty = true,
  needShow = true,
  cw = 0,
  ch = 0,
  lo = 0,
  hi = 0,
  rows = 32,
  ps = 0.5,
  avgDt = 0,
  refStall = 0,
  lastT = 0,
  mode = '',
  shotReq = false,
  anim = null,
  cycT = 0
const TARGET_MS = [22, 40, 75]

const prepare = () => {
  const N = maxIter()
  let off = ref && offset()
  // Neue Referenz, wenn der Orbit zu kurz ist oder die Float-Mantisse des Offsets die Pixel nicht mehr auflöst
  if (!ref || ref.N < N || off[2] > ls + 8) {
    computeRef(Math.round(N * 1.3))
    off = offset()
  }
  renderer.setView({ ls, rot, off, refLen: ref.len, maxIter: N })
}

// Zeitliche Glättung der Vorschau: Anteil des neuen Bildes pro Frame; shown = Ansicht und Farben des zuletzt gezeigten Bildes.
// Gemessen bei grober Vorschau: 0,3 flimmert noch etwa dreimal so stark wie 0,1; sichtbares Nachziehen gibt es bei 0,1 nicht.
const HIST_BLEND = 0.1
let shown = null,
  fresh = false
const insideRgb = (() => {
  let key, val
  return (c) => (c === key ? val : ((key = c), (val = rgb(c).map((v) => v / 255))))
})()
const display = () => {
  // Ohne cycT: der Farbzyklus ändert sich von Frame zu Frame nur unmerklich
  const key = JSON.stringify([S.pal, S.custom, S.map, S.angle, S.dens, S.phase, S.relief, S.height, S.light, S.gloss, S.inside])
  let blend = 1,
    hrot = [1, 0],
    hoff = [0, 0]
  if (shown?.key === key && fresh) {
    const d = cFE(cx - rescale(shown.x, shown.p, P), cy - rescale(shown.y, shown.p, P), P)
    ;({ rot: hrot, off: hoff } = reprojection(d, shown, { ls, rot }))
    blend = HIST_BLEND
  } else if (shown?.key === key) blend = S.cycle ? HIST_BLEND : 0
  renderer.display(cw, ch, {
    band: [Math.max(lo, 0), Math.min(hi, ch)],
    ps,
    map: S.map,
    angle: S.angle,
    dens: S.dens,
    phase: S.phase + cycT,
    relief: S.relief,
    height: S.height,
    light: (S.light * Math.PI) / 180,
    gloss: S.gloss,
    inside: insideRgb(S.inside),
    blend,
    hrot,
    hoff
  })
  shown = { x: cx, y: cy, p: P, ls, rot, key }
  fresh = false
}

const frame = (t) => {
  requestAnimationFrame(frame)
  if (renderer.isLost()) return
  const dt = Math.min(t - lastT, 500)
  lastT = t
  anim?.(t)
  const f = +S.res || devicePixelRatio,
    w = Math.round(innerWidth * f),
    h = Math.round(innerHeight * f)
  if (w !== cw || h !== ch) {
    ;[canvas.width, canvas.height, cw, ch, dirty] = [w, h, w, h, true]
    renderer.resize(w, h)
    shown = null
  }
  if (dirty) {
    // Geglättete Framezeit, Totbereich und kleine Schritte: sprunghafte Auflösungswechsel flackern sichtbar
    if (mode === 'prev' && !refStall) {
      avgDt = avgDt ? avgDt * 0.85 + dt * 0.15 : dt
      const tg = TARGET_MS[S.quality]
      ps = Math.min(1, Math.max(0.08, ps * (avgDt < tg * 0.75 ? 1.025 : avgDt > tg * 1.3 ? 0.96 : 1)))
    }
    // Die Framezeit hinkt hinterher: nach einem Sprung in die Tiefe darf schon das erste Bild die GPU nicht überlasten
    ps = Math.min(ps, maxPreviewScale(w, h, maxIter()))
    refStall = Math.max(0, refStall - 1)
    dirty = false
    prepare()
    renderer.compute('prev', Math.ceil(w * ps), Math.ceil(h * ps))
    lo = hi = h >> 1
    mode = 'prev'
    needShow = fresh = true
    syncUI()
  } else if (lo > 0 || hi < h) {
    // Streifenweise von der Mitte nach außen, damit tiefe Frames den GPU-Watchdog nicht auslösen. Die Framezeit allein
    // reicht als Maß nicht: nach billigen Zeilen kann der nächste Streifen voller Innenpunkte vielfach teurer sein.
    if (mode === 'full') rows = dt < 30 ? Math.min(h, Math.ceil(rows * 1.5)) : dt > 70 ? Math.max(2, rows >> 1) : rows
    rows = Math.min(rows, maxStripRows(w, maxIter()))
    mode = 'full'
    renderer.compute('full', w, h, hi, hi + rows)
    renderer.compute('full', w, h, lo - rows, lo)
    ;[hi, lo] = [hi + rows, lo - rows]
    needShow = true
  } else mode = ''
  if (S.cycle) {
    cycT = (cycT + (S.cycle * dt) / 8000) % 1
    needShow = true
  }
  if (needShow) {
    display()
    needShow = false
  }
  if (shotReq) {
    shotReq = false
    canvas.toBlob((b) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = `mandelbrot-1e${zoom10().toFixed(1)}.png`
      a.click()
    })
  }
  hud()
}

// --- HUD & Panel-Synchronisation ---
const zoom10 = () => zoomOf(ls)
const hud = () => {
  $('#hZoom').innerHTML = `1e${Math.max(0, zoom10()).toFixed(2)} <small>Vergrößerung</small>`
  $('#hInfo').textContent = `${maxIter().toLocaleString('de')} Iterationen · ${P} Bit · Referenz ${ref?.len.toLocaleString('de')}`
  $('#hBar').style.width = `${Math.min(100, (100 * (Math.min(hi, ch) - Math.max(lo, 0))) / ch)}%`
  const out = document.querySelector('[data-k=iter]')?.parentElement.querySelector('output')
  if (out) out.textContent = maxIter() >= 1e4 ? `${Math.round(maxIter() / 1000)}k` : maxIter()
}
let uiTimer
const syncUI = () => {
  clearTimeout(uiTimer)
  uiTimer = setTimeout(
    () => {
      const [re, im] = [toDec(cx, P), toDec(cy, P)]
      document.activeElement !== $('#re') && ($('#re').value = re)
      document.activeElement !== $('#im') && ($('#im').value = im)
      document.activeElement !== $('#zoom') && ($('#zoom').value = zoom10().toFixed(3))
      $('#rot').value = Math.round((rot * 180) / Math.PI)
      $('#rotOut').textContent = `${$('#rot').value}°`
      history.replaceState(null, '', `#re=${re}&im=${im}&z=${ls.toFixed(4)}&r=${rot.toFixed(4)}${placeMul > 1 ? `&m=${placeMul.toFixed(2)}` : ''}`)
      drawMini()
    },
    anim ? 250 : 120
  )
}
const toast = (msg) => {
  $('#toast').textContent = msg
  $('#toast').classList.add('show')
  setTimeout(() => $('#toast').classList.remove('show'), 1800)
}

// --- Übersichtskarte ---
const mini = $('#mini'),
  mctx = mini.getContext('2d'),
  MB = { x0: -2.4, x1: 1.0, y: 0.9 }
const miniImg = (() => {
  const { width: w, height: h } = mini,
    img = mctx.createImageData(w, h)
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++) {
      const x0 = MB.x0 + ((MB.x1 - MB.x0) * px) / w,
        y0 = MB.y - (2 * MB.y * py) / h
      let x = 0,
        y = 0,
        i = 0
      for (; i < 200 && x * x + y * y < 16; i++) [x, y] = [x * x - y * y + x0, 2 * x * y + y0]
      const v = i === 200 ? 0 : Math.sqrt(i / 200),
        k = 4 * (py * w + px)
      img.data.set([30 + 90 * v, 40 + 160 * v, 70 + 185 * v, 255], k)
    }
  return img
})()
const drawMini = () => {
  const { width: w, height: h } = mini,
    X = (x) => ((x - MB.x0) / (MB.x1 - MB.x0)) * w,
    Y = (y) => ((MB.y - y) / (2 * MB.y)) * h
  const x = toNum(cx, P),
    y = toNum(cy, P),
    r = 2 ** ls,
    sx = (r * innerWidth) / innerHeight
  mctx.putImageData(miniImg, 0, 0)
  mctx.strokeStyle = '#ffb86b'
  mctx.lineWidth = 1.5
  if (X(x + sx) - X(x - sx) > 6) mctx.strokeRect(X(x - sx), Y(y + r), X(x + sx) - X(x - sx), Y(y - r) - Y(y + r))
  mctx.beginPath()
  mctx.arc(X(x), Y(y), 4, 0, 7)
  mctx.moveTo(X(x) - 9, Y(y))
  mctx.lineTo(X(x) + 9, Y(y))
  mctx.moveTo(X(x), Y(y) - 9)
  mctx.lineTo(X(x), Y(y) + 9)
  mctx.stroke()
}
mini.addEventListener('click', (e) => {
  stopTour()
  const b = mini.getBoundingClientRect(),
    x = MB.x0 + ((MB.x1 - MB.x0) * (e.clientX - b.left)) / b.width,
    y = MB.y - (2 * MB.y * (e.clientY - b.top)) / b.height
  setView({ re: x.toFixed(17), im: y.toFixed(17), z: Math.max(ls, -8), r: rot })
})

// --- Flüge & Tour ---
let flightDone = null
const fly = (dest, dur = S.fly * 1000) =>
  new Promise((resolve) => {
    flightDone?.(false)
    flightDone = resolve
    const L = Math.max(fitZ(), ls),
      tp = precFor(dest.z),
      tx = fromDec(dest.re, tp),
      ty = fromDec(dest.im, tp)
    const destRot = S.align ? (dest.r ?? 0) : 0,
      need = dest.p ? Math.max(1, (6 * dest.p) / autoIter(dest.z)) : (dest.m ?? 1)
    const [sx, sy, sl, sr, ex, ey] = [toNum(cx, P), toNum(cy, P), ls, rot, toNum(tx, tp), toNum(ty, tp)]
    const panD = Math.hypot(ex - sx, ey - sy),
      tPan = panD > 1e-3 ? Math.min(2500, 700 + 1500 * panD) : 0
    const wOut = (L - sl) * 0.35,
      wIn = L - dest.z,
      rest = Math.max(1000, dur - tPan)
    const tOut = (rest * wOut) / (wOut + wIn || 1),
      t0 = performance.now()
    let entered = false
    $('#flight').style.display = 'block'
    $('#flight').textContent = `✈ ${dest.name ?? 'Flug'}`
    anim = (t) => {
      const e = Math.max(0, t - t0)
      if (e < tOut) {
        ls = sl + (L - sl) * ease(e / tOut)
        rot = sr * (1 - ease(e / tOut))
        updPrec()
      } else if (e < tOut + tPan) {
        const u = ease((e - tOut) / tPan)
        ;[ls, rot, P] = [L, 0, 64]
        cx = BigInt(Math.round((sx + (ex - sx) * u) * 2 ** 64))
        cy = BigInt(Math.round((sy + (ey - sy) * u) * 2 ** 64))
      } else {
        if (!entered) {
          // Referenz einmalig am Ziel in voller Tiefe, dann bleibt sie für den ganzen Anflug gültig
          entered = true
          placeMul = need
          ;[ls, P, cx, cy] = [dest.z, tp, tx, ty]
          computeRef(Math.round(maxIter(dest.z) * 1.1))
        }
        const u = Math.min(1, (e - tOut - tPan) / (rest - tOut))
        ls = L + (dest.z - L) * ease(u)
        rot = wrapAngle(destRot) * ease(u)
        const p = precFor(ls)
        ;[cx, cy, P] = [rescale(tx, tp, p), rescale(ty, tp, p), p]
        if (u >= 1) {
          anim = null
          flightDone = null
          $('#flight').style.display = touring ? 'block' : 'none'
          resolve(true)
        }
      }
      dirty = true
    }
  })
const stopFlight = () => {
  if (anim) {
    anim = null
    flightDone?.(false)
    flightDone = null
  }
  $('#flight').style.display = 'none'
}
let touring = false
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tour = async () => {
  touring = true
  $('#tour').textContent = '■ Tour stoppen'
  $('#tTour').textContent = '■'
  do {
    const list = [...PLACES, ...S.mine]
    S.shuffle && list.sort(() => Math.random() - 0.5)
    for (const pl of list) {
      highlight(pl)
      if (!touring || !(await fly(pl))) break
      const t0 = performance.now()
      while (touring && (performance.now() - t0 < S.hold * 1000 || ((lo > 0 || hi < ch) && performance.now() - t0 < 12000))) await sleep(100)
      if (!touring) break
    }
  } while (touring && S.loop)
  stopTour()
}
const stopTour = () => {
  touring = false
  stopFlight()
  $('#tour').textContent = '▶ Tour starten'
  $('#tTour').textContent = '▶'
}
const toggleTour = () => (touring ? stopTour() : tour())

const highlight = (pl) => document.querySelectorAll('.place').forEach((b) => b.classList.toggle('on', b.pl === pl))
const renderPlaces = () => {
  const box = $('#places')
  box.innerHTML = ''
  ;[...PLACES, ...S.mine].forEach((pl) => {
    const b = document.createElement('button')
    b.className = 'place'
    b.pl = pl
    b.innerHTML = `<span><b></b><small></small></span><span><em>1e${zoomOf(pl.z).toFixed(0)}</em></span>`
    b.querySelector('b').textContent = pl.name
    b.querySelector('small').textContent = pl.info ?? 'Eigener Ort'
    if (S.mine.includes(pl)) {
      const x = document.createElement('span')
      x.className = 'x'
      x.textContent = '✕'
      x.title = 'Löschen'
      x.onclick = (e) => {
        e.stopPropagation()
        confirm(`„${pl.name}“ löschen?`) && updateMine((list) => list.filter((q) => !['name', 're', 'im', 'z'].every((k) => q[k] === pl[k])))
      }
      b.lastChild.append(x)
    }
    b.onclick = () => {
      stopTour()
      highlight(pl)
      closeOnMobile()
      fly(pl)
    }
    box.append(b)
  })
}

// --- Panel-Bindings ---
const FMT = {
  dens: (v) => v.toFixed(2) + '×',
  phase: (v) => v.toFixed(2),
  cycle: (v) => v.toFixed(2),
  relief: (v) => Math.round(v * 100) + ' %',
  height: (v) => v.toFixed(2),
  light: (v) => v + '°',
  gloss: (v) => Math.round(v * 100) + ' %',
  fly: (v) => v + ' s',
  hold: (v) => v + ' s'
}
const bound = []
document.querySelectorAll('[data-k]').forEach((el) => {
  const k = el.dataset.k,
    log = 'log' in el.dataset,
    out = el.parentElement.querySelector('output')
  const put = () => {
    el.type === 'checkbox' ? (el.checked = S[k]) : (el.value = log ? Math.log2(S[k]) : S[k])
    out && FMT[k] && (out.textContent = FMT[k](S[k]))
  }
  bound.push(put)
  put()
  el.addEventListener('input', () => {
    S[k] = el.type === 'checkbox' ? el.checked : el.type === 'color' ? el.value : log ? 2 ** +el.value : +el.value
    out && FMT[k] && (out.textContent = FMT[k](S[k]))
    save()
    ;['iter', 'res'].includes(k) ? (dirty = true) : (needShow = true)
  })
})
const pals = $('#pals')
const renderPals = () => {
  pals.innerHTML = ''
  Object.keys(PALETTES).forEach((n) => {
    const d = document.createElement('div'),
      st = stops(n)
    d.title = n === 'Zufall' ? 'Zufall (erneut klicken für neue Farben)' : n
    d.style.background = `linear-gradient(90deg, ${[...st, st[0]].join(',')})`
    d.classList.toggle('on', S.pal === n)
    d.onclick = () => {
      if (n === 'Zufall' && S.pal === 'Zufall') S.custom = randomPal()
      S.pal = n
      save()
      uploadPal()
      renderPals()
    }
    pals.append(d)
  })
}

const readInputs = () => ({
  re: $('#re').value.replace(/\s/g, ''),
  im: $('#im').value.replace(/\s/g, ''),
  z: fromZoom10(+$('#zoom').value),
  r: rot,
  name: 'Eingabe'
})
const guard = (f) => () => {
  try {
    f()
  } catch (e) {
    toast(String(e))
  }
}
$('#jump').onclick = guard(() => {
  stopTour()
  placeMul = 1
  setView(readInputs())
})
$('#flyto').onclick = guard(() => {
  stopTour()
  closeOnMobile()
  fromDec(readInputs().re, 64)
  fly(readInputs())
})
$('#zin').onclick = () => {
  zoomAt([0, 0], -2)
}
$('#zout').onclick = () => {
  zoomAt([0, 0], 2)
}
$('#reset').onclick = () => {
  stopTour()
  placeMul = 1
  setView(HOME)
}
$('#resetAll').onclick = () => {
  if (!confirm('Alle Einstellungen auf den Ausgangszustand setzen? Gemerkte Orte bleiben erhalten.')) return
  Object.assign(S, { ...DEF, mine: S.mine })
  cycT = 0
  save()
  bound.forEach((f) => f())
  uploadPal()
  renderPals()
  dirty = true
  toast('Einstellungen zurückgesetzt')
}
$('#rot').oninput = (e) => {
  rot = (e.target.value * Math.PI) / 180
  $('#rotOut').textContent = `${e.target.value}°`
  dirty = true
}
$('#copy').onclick = () => {
  syncUI()
  setTimeout(
    () =>
      navigator.clipboard.writeText(location.href).then(
        () => toast('Link kopiert'),
        () => toast('Kopieren nicht möglich')
      ),
    150
  )
}
$('#shot').onclick = $('#tShot').onclick = () => {
  shotReq = needShow = true
}
$('#save').onclick = () => {
  const name = prompt('Name für diesen Ort:', `Ort ${S.mine.length + 1}`)
  if (!name) return
  updateMine((list) => [...list, { name, re: toDec(cx, P), im: toDec(cy, P), z: ls, r: rot, m: placeMul }])
  toast('Ort gespeichert')
}
const setPanel = (open) => {
  document.body.classList.toggle('open', open)
  $('#tPanel').textContent = open ? '✕' : '☰'
}
const closeOnMobile = () => innerWidth <= 700 && setPanel(false)
$('#tour').onclick = () => {
  closeOnMobile()
  toggleTour()
}
$('#tTour').onclick = toggleTour
$('#tPanel').onclick = () => setPanel(!document.body.classList.contains('open'))
$('#tFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())
$('#tHome').onclick = () => $('#reset').click()
$('#tHelp').onclick = () => $('#help').classList.toggle('show')
$('#help').onclick = () => $('#help').classList.remove('show')

// --- Maus, Touch, Tastatur ---
const uvAt = (x, y) => [(2 * x - innerWidth) / innerHeight, (innerHeight - 2 * y) / innerHeight]
const user = stopTour
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    user()
    zoomAt(uvAt(e.clientX, e.clientY), Math.max(-1, Math.min(1, e.deltaY * 0.002)))
  },
  { passive: false }
)
canvas.addEventListener('dblclick', (e) => {
  user()
  zoomAt(uvAt(e.clientX, e.clientY), e.shiftKey ? 2 : -2)
})
const ptrs = new Map()
canvas.addEventListener('pointerdown', (e) => {
  user()
  ptrs.set(e.pointerId, [e.clientX, e.clientY])
  canvas.setPointerCapture(e.pointerId)
})
canvas.addEventListener('pointerup', (e) => ptrs.delete(e.pointerId))
canvas.addEventListener('pointercancel', (e) => ptrs.delete(e.pointerId))
canvas.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return
  const [a, b] = [...ptrs.values()],
    old = ptrs.size === 2 ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(a[0] - b[0], a[1] - b[1])] : null
  const [px, py] = ptrs.get(e.pointerId)
  ptrs.set(e.pointerId, [e.clientX, e.clientY])
  if (!old) return move((-2 * (e.clientX - px)) / innerHeight, (2 * (e.clientY - py)) / innerHeight)
  const [c, d] = [...ptrs.values()],
    mx = (c[0] + d[0]) / 2,
    my = (c[1] + d[1]) / 2
  move((-2 * (mx - old[0])) / innerHeight, (2 * (my - old[1])) / innerHeight)
  zoomAt(uvAt(mx, my), Math.log2(old[2] / Math.hypot(c[0] - d[0], c[1] - d[1])))
})
addEventListener('keydown', (e) => {
  if (['TEXTAREA', 'INPUT'].includes(e.target.tagName) && e.target.type !== 'range' && e.target.type !== 'checkbox') return
  const K = {
    '+': () => {
      S.iter *= 1.5
      dirty = true
    },
    '-': () => {
      S.iter /= 1.5
      dirty = true
    },
    ']': () => {
      S.dens *= 1.25
      needShow = true
    },
    '[': () => {
      S.dens /= 1.25
      needShow = true
    },
    ArrowLeft: () => move(-0.2, 0),
    ArrowRight: () => move(0.2, 0),
    ArrowUp: () => move(0, 0.2),
    ArrowDown: () => move(0, -0.2),
    PageUp: () => zoomAt([0, 0], -0.5),
    PageDown: () => zoomAt([0, 0], 0.5),
    q: () => {
      rot += 0.05
      dirty = true
    },
    e: () => {
      rot -= 0.05
      dirty = true
    },
    r: () => $('#reset').click(),
    t: toggleTour,
    ' ': stopTour,
    p: () => $('#tPanel').click(),
    f: () => $('#tFull').click(),
    s: () => $('#shot').click(),
    h: () => $('#tHelp').click(),
    Escape: () => $('#help').classList.remove('show')
  }[e.key]
  if (!K) return
  e.preventDefault()
  if (!['t', ' ', 'p', 'f', 's', 'h', 'Escape', '[', ']'].includes(e.key)) stopTour()
  K()
  bound.forEach((f) => f())
  save()
})

// --- Start ---
const params = new URLSearchParams(location.hash.slice(1))
placeMul = Math.max(1, +params.get('m') || 1)
try {
  params.has('re') ? setView({ re: params.get('re'), im: params.get('im'), z: +params.get('z'), r: +(params.get('r') ?? 0) }) : setView(HOME)
} catch {
  setView(HOME)
}
uploadPal()
renderPals()
renderPlaces()
setPanel(innerWidth >= 900 && !params.has('clean'))
if (params.has('clean')) $('#hud').style.display = $('#tools').style.display = 'none'
if (params.has('tour')) tour()
requestAnimationFrame(frame)
