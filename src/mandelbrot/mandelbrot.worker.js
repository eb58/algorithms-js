const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const range = (n) => [...Array(n).keys()]
const rand255 = () => Math.floor(Math.random() * 255)

const NCOLORS = 100
const COLORS = range(NCOLORS).map(() => [rand255(), rand255(), rand255(), 255])

const cadd = (c1, c2) => ({ r: c1.r + c2.r, i: c1.i + c2.i })
const csqr = (c) => ({ r: c.r * c.r - c.i * c.i, i: 2 * c.r * c.i })

const mandelbrotX = (c, MAX_ITERATIONS = 100) => {
  let [z, n] = [c, 0]
  while (++n < MAX_ITERATIONS && z.r * z.r + z.i * z.i <= 4) z = cadd(csqr(z), c) // f(z) = z^2 + c
  return n >= MAX_ITERATIONS ? [255, 255, 255, 255] : COLORS[n % NCOLORS]
}

const mandelbrots = (c, maxIterations = 100) => {
  // f(z) = z^2 + c
  let [x, y, n, re, im] = [0, 0, 0, c.r, c.i]
  while (x * x + y * y <= 4 && n++ < maxIterations) {
    const xTemp = x * x - y * y + re
    y = 2 * x * y + im
    x = xTemp
  }
  return n >= maxIterations ? [255, 255, 255, 255] : COLORS[n % NCOLORS]
}

const mandelbrot = (cx, cy, maxIterations) => {
  let x = 0
  let y = 0
  let n = 0

  while (x * x + y * y <= 4 && n++ < maxIterations) {
    const xTemp = x * x - y * y + cx
    y = 2 * x * y + cy
    x = xTemp
  }
  return n >= maxIterations ? [255, 255, 255, 255] : COLORS[n % NCOLORS]
}

const computeImage = (pixels, maxIterations) => pixels.map((row) => row.map((c) => mandelbrot(c.r, c.i, maxIterations)))

onmessage = (e) => {
  const t = timer()
  const { pixels, maxIterations } = e.data
  console.log('WORKER1', t.elapsedTime())
  const data = computeImage(pixels, maxIterations)
  console.log('WORKER2', t.elapsedTime())
  postMessage(data)
}
