const { execFile } = require('node:child_process')
const { existsSync, mkdtempSync, readdirSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')

// braucht den tsc-Build neben der Seite und das Nachbar-Repo ebtable
const excluded = ['src/ts/index-card-app/IndexCardApp.html']

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].find((path) => path && existsSync(path))

const root = join(__dirname, '..')
const pages = readdirSync(join(root, 'src'), { recursive: true })
  .map((file) => `src/${file.replaceAll('\\', '/')}`)
  .filter((file) => file.endsWith('.html') && !excluded.includes(file))

// eigenes Profil pro Aufruf, sonst blockieren sich parallele Chrome-Instanzen
const uncaughtErrors = (page) =>
  new Promise((resolve, reject) => {
    const profile = mkdtempSync(join(tmpdir(), 'html-smoke-'))
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-logging=stderr',
      '--v=0',
      `--user-data-dir=${profile}`,
      '--virtual-time-budget=3000',
      '--dump-dom',
      pathToFileURL(join(root, page)).href
    ]
    execFile(chrome, args, { timeout: 30000, maxBuffer: 64 << 20 }, (err, _stdout, stderr) => {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5 })
      err && !stderr
        ? reject(err)
        : resolve(stderr.split('\n').filter((line) => /:CONSOLE:\d+\] "Uncaught/.test(line)).map((line) => line.replace(/^.*?:CONSOLE:\d+\] /, '').trim()))
    })
  })

;(chrome ? describe : describe.skip)('HTML pages load without uncaught errors', () => {
  test.concurrent.each(pages)('%s', async (page) => expect(await uncaughtErrors(page)).toEqual([]), 30000)
})
