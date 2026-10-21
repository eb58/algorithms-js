// Rendert eine Mandelbrot-Tour Bild für Bild in voller Auflösung und fügt die PNG-Folge mit FFmpeg zu einem MP4 zusammen.
// Die Bilder rechnet die Browser-App (mandelbrot.html) in Headless-Chrome auf der GPU; dieses Skript steuert sie über das
// DevTools-Protokoll. Vorhandene Bilder werden übersprungen, ein abgebrochener Lauf setzt also beim nächsten Aufruf fort.
//
//   npm run mandelbrot:video -- --size 1920x1080 --fps 30 --places "Seepferdchental,Nadel"
const { spawn, spawnSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const fs = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { parseArgs } = require('node:util')
const { decimalOf, tourFrames, viewOf } = require('./tour')
const { fitLs } = require('./view')
const PLACES = require('./places')

const OPTIONS = {
  size: { type: 'string', default: '1920x1080' },
  fps: { type: 'string', default: '30' },
  fly: { type: 'string', default: '12' }, // Sekunden je Flug
  hold: { type: 'string', default: '3' }, // Sekunden Verweilen am Ziel
  ss: { type: 'string', default: '1' }, // Überabtastung: in ss-facher Größe rechnen, beim Kodieren verkleinern
  places: { type: 'string' }, // Namen oder Nummern (ab 1), durch Kommas getrennt; ohne Angabe alle Orte
  settings: { type: 'string', default: '{}' }, // App-Einstellungen als JSON, z. B. {"pal":"Feuer","relief":0.6}
  out: { type: 'string', default: 'out/mandelbrot-video' },
  'no-align': { type: 'boolean', default: false },
  help: { type: 'boolean', default: false }
}

const positive = (name, value, integer = false) => {
  const n = Number(value)
  if (!(n > 0) || (integer && !Number.isInteger(n)))
    throw new Error(`--${name} erwartet eine positive ${integer ? 'ganze ' : ''}Zahl, nicht „${value}“`)
  return n
}

// Kommandozeile prüfen und in eine Konfiguration übersetzen; wirft bei ungültigen Werten
const parseOptions = (args) => {
  const { values: o } = parseArgs({ args, options: OPTIONS, strict: true })
  const size = /^(\d+)x(\d+)$/.exec(o.size)
  if (!size) throw new Error(`--size erwartet BREITExHÖHE, nicht „${o.size}“`)
  const [width, height] = [+size[1], +size[2]]
  if (width % 2 || height % 2 || width < 64 || height < 64 || width > 7680 || height > 4320) {
    throw new Error('--size: gerade Kantenlängen zwischen 64 und 7680×4320 Pixeln')
  }
  const ss = positive('ss', o.ss, true)
  if (ss > 4 || width * ss > 16384 || height * ss > 16384) throw new Error('--ss: höchstens 4 und höchstens 16384 Pixel Kantenlänge')
  let settings
  try {
    settings = JSON.parse(o.settings)
  } catch {
    throw new Error('--settings ist kein gültiges JSON')
  }
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('--settings muss ein JSON-Objekt sein')
  return {
    help: o.help,
    width,
    height,
    fps: positive('fps', o.fps, true),
    fly: positive('fly', o.fly) * 1000,
    hold: Number(o.hold) >= 0 ? Number(o.hold) * 1000 : positive('hold', o.hold),
    ss,
    align: !o['no-align'],
    places: selectPlaces(o.places),
    settings,
    out: o.out
  }
}

const selectPlaces = (spec) => {
  if (!spec) return PLACES
  return spec.split(',').map((s) => {
    const key = s.trim(),
      byNumber = /^\d+$/.test(key) ? PLACES[+key - 1] : null,
      place = byNumber ?? PLACES.find((p) => p.name.toLowerCase() === key.toLowerCase())
    if (!place) throw new Error(`Unbekannter Ort „${key}“. Verfügbar: ${PLACES.map((p, i) => `${i + 1} ${p.name}`).join(', ')}`)
    return place
  })
}

// Ein Ordner je Variante: alles, was die Bilder beeinflusst, geht in den Namen ein, damit nichts Unpassendes fortgesetzt wird
const variantName = ({ width, height, fps, fly, hold, ss, align, places, settings }) => {
  const hash = createHash('sha1')
    .update(JSON.stringify({ fly, hold, ss, align, places: places.map((p) => p.name), settings }))
    .digest('hex')
    .slice(0, 6)
  return `${width}x${height}_${fps}fps_${hash}`
}
const frameFile = (dir, i) => path.join(dir, `frame_${String(i + 1).padStart(5, '0')}.png`)

const sameView = (a, b) => a && b && a.cx === b.cx && a.cy === b.cy && a.ls === b.ls && a.rot === b.rot && a.m === b.m

const formatTime = (ms) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s} s` : s < 3600 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`
}

const findChrome = () =>
  [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ].find((p) => p && fs.existsSync(p))

// FFmpeg im PATH oder in der üblichen WinGet-Installation (winget install --id Gyan.FFmpeg -e)
const findFfmpeg = () => {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH
  if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0) return 'ffmpeg'
  const winget = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages')
  if (!winget || !fs.existsSync(winget)) return null
  for (const pkg of fs.readdirSync(winget).filter((d) => d.startsWith('Gyan.FFmpeg'))) {
    const exe = fs
      .readdirSync(path.join(winget, pkg), { recursive: true })
      .map(String)
      .find((f) => /(^|[\\/])bin[\\/]ffmpeg\.exe$/.test(f))
    if (exe) return path.join(winget, pkg, exe)
  }
  return null
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Minimaler DevTools-Client über die WebSocket-Schnittstelle von Node.js
const connect = async (url) => {
  const ws = new WebSocket(url)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('Keine Verbindung zu Chrome'))
  })
  let id = 0
  const pending = new Map()
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    pending.get(d.id)?.(d)
    pending.delete(d.id)
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(++id, (d) => (d.error ? reject(new Error(`${method}: ${d.error.message}`)) : resolve(d.result)))
      ws.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    return r.result.value
  }
  return { send, evaluate, close: () => ws.close() }
}

const launchChrome = async (exe, width, height) => {
  const profile = fs.mkdtempSync(path.join(tmpdir(), 'mandelbrot-video-'))
  const args = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${width},${height}`, '--hide-scrollbars']
  if (process.platform === 'win32') args.push('--use-angle=d3d11') // echte GPU statt Software-Rendering
  const proc = spawn(exe, [...args, 'about:blank'], { stdio: 'ignore' })
  const portFile = path.join(profile, 'DevToolsActivePort')
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100)
  if (!fs.existsSync(portFile)) throw new Error('Chrome hat keinen DevTools-Port geöffnet')
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim()
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  const cdp = await connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  const stop = () => {
    cdp.close()
    proc.kill()
    setTimeout(() => fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 }), 500)
  }
  return { cdp, stop }
}

const openApp = async (cdp, { width, height, settings }) => {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  // Einstellungen wie in der App über localStorage, bevor app.js sie liest
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('mandel-deepzoom', ${JSON.stringify(JSON.stringify(settings))})`
  })
  await cdp.send('Page.navigate', { url: `${pathToFileURL(path.join(__dirname, 'mandelbrot.html')).href}#clean` })
  for (let i = 0; i < 100; i++) {
    await sleep(100)
    const state = await cdp.evaluate(
      `document.readyState === 'complete' && (getComputedStyle(document.querySelector('#err')).display !== 'none' ? 'err:' + document.querySelector('#err').textContent : !!globalThis.MandelbrotRender)`
    )
    if (typeof state === 'string') throw new Error(`Die App meldet: ${state.slice(4)}`)
    if (state) return
  }
  throw new Error('Die App ist nicht geladen')
}

const encode = (ffmpeg, dir, { width, height, fps, ss }, file) =>
  new Promise((resolve, reject) => {
    const args = ['-y', '-loglevel', 'error', '-stats', '-framerate', String(fps), '-i', path.join(dir, 'frame_%05d.png')]
    if (ss > 1) args.push('-vf', `scale=${width}:${height}:flags=lanczos`)
    args.push('-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file)
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'inherit', 'inherit'] })
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg endete mit Code ${code}`))))
  })

const main = async () => {
  const cfg = parseOptions(process.argv.slice(2))
  if (cfg.help) {
    console.log(
      fs
        .readFileSync(__filename, 'utf8')
        .split('\n')
        .slice(0, 5)
        .join('\n')
        .replace(/^\/\/ ?/gm, '')
    )
    console.log(
      `\nOptionen: ${Object.keys(OPTIONS)
        .map((k) => `--${k}`)
        .join(' ')}\nOrte: ${PLACES.map((p, i) => `${i + 1} ${p.name}`).join(', ')}`
    )
    return
  }
  if (typeof WebSocket === 'undefined') throw new Error('Benötigt Node.js ab Version 22 (WebSocket)')
  const chrome = findChrome()
  if (!chrome) throw new Error('Chrome oder Edge nicht gefunden (Pfad über CHROME_PATH angeben)')
  const ffmpeg = findFfmpeg()
  if (!ffmpeg) throw new Error('FFmpeg nicht gefunden: winget install --id Gyan.FFmpeg -e (oder Pfad über FFMPEG_PATH angeben)')

  const homeLs = fitLs(cfg.height / cfg.width)
  const frames = tourFrames(cfg.places, {
    start: viewOf({ re: '-0.75', im: '0', z: homeLs }),
    fps: cfg.fps,
    fly: cfg.fly,
    hold: cfg.hold,
    align: cfg.align,
    homeLs
  })
  const dir = path.resolve(cfg.out, variantName(cfg))
  const framesDir = path.join(dir, 'frames')
  fs.mkdirSync(framesDir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify({ ...cfg, places: cfg.places.map((p) => p.name) }, null, 2))
  const missing = frames.filter((_, i) => !fs.existsSync(frameFile(framesDir, i))).length
  console.log(`${frames.length} Bilder (${formatTime((frames.length / cfg.fps) * 1000)} Film), davon ${missing} zu rechnen → ${dir}`)

  if (missing) {
    const { cdp, stop } = await launchChrome(chrome, cfg.width * cfg.ss, cfg.height * cfg.ss)
    process.once('SIGINT', () => {
      stop()
      console.log('\nAbgebrochen – beim nächsten Aufruf geht es mit den fehlenden Bildern weiter.')
      process.exit(130)
    })
    try {
      await openApp(cdp, { width: cfg.width * cfg.ss, height: cfg.height * cfg.ss, settings: cfg.settings })
      const t0 = Date.now()
      let done = 0
      for (let i = 0; i < frames.length; i++) {
        const file = frameFile(framesDir, i)
        if (fs.existsSync(file)) continue
        // Verweilbilder ohne Farbzyklus sind identisch: einmal rechnen, dann kopieren
        if (i > 0 && !cfg.settings.cycle && sameView(frames[i], frames[i - 1]) && fs.existsSync(frameFile(framesDir, i - 1))) {
          fs.copyFileSync(frameFile(framesDir, i - 1), file)
        } else {
          await cdp.evaluate(`MandelbrotRender.show(${JSON.stringify(decimalOf(frames[i]))}, ${(i * 1000) / cfg.fps})`)
          const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' })
          fs.writeFileSync(`${file}.tmp`, Buffer.from(data, 'base64'))
          fs.renameSync(`${file}.tmp`, file) // erst vollständig geschriebene Bilder zählen als vorhanden
        }
        done++
        const per = (Date.now() - t0) / done
        process.stdout.write(
          `\rBild ${i + 1}/${frames.length} · ${frames[i].place} · ${(per / 1000).toFixed(1)} s/Bild · Rest ${formatTime(per * (missing - done))}   `
        )
      }
      process.stdout.write('\n')
    } finally {
      stop()
    }
  }

  const video = path.join(dir, 'mandelbrot.mp4')
  console.log('Kodiere Video …')
  await encode(ffmpeg, framesDir, cfg, video)
  console.log(`Fertig: ${video}`)
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`\nFehler: ${e.message}`)
    process.exit(1)
  })
}

module.exports = { parseOptions, selectPlaces, variantName, frameFile, sameView, formatTime }
